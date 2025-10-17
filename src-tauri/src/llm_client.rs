use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::error::Error;
use chrono::Local;

#[derive(Debug)]
pub enum Provider {
    Ollama { base_url: String },
    OpenAI { api_key: String },
    LMStudio { base_url: String },
}

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: Option<OllamaOptions>,
}

#[derive(Serialize)]
struct OllamaOptions {
    temperature: Option<f32>,
    top_p: Option<f32>,
    max_tokens: Option<i32>,
}

#[derive(Deserialize, Serialize, Debug)]
struct OllamaResponse {
    model: String,
    response: String,
}

pub async fn generate(provider: Provider, prompt: String, model: Option<String>) -> Result<String, Box<dyn Error>> {
    match provider {
        Provider::Ollama { base_url } => call_ollama(&base_url, prompt, model).await,
        Provider::OpenAI { api_key } => call_openai(&api_key, prompt, model).await,
        Provider::LMStudio { base_url } => call_lmstudio(&base_url, prompt, model).await,
    }
}

// Attempt to list available models for a provider. Returns Vec<String> on success.
pub async fn list_models_for_provider(provider: Provider) -> Result<Vec<String>, Box<dyn Error>> {
    let client = Client::new();
    match provider {
        Provider::OpenAI { api_key } => {
            // Call OpenAI models endpoint
            let resp = client
                .get("https://api.openai.com/v1/models")
                .bearer_auth(api_key)
                .send()
                .await?;
            if resp.status().is_success() {
                let json: serde_json::Value = resp.json().await?;
                if let Some(data) = json.get("data").and_then(|d| d.as_array()) {
                    let mut out = vec![];
                    for item in data {
                        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
                            out.push(id.to_string());
                        }
                    }
                    return Ok(out);
                }
                return Err("Unexpected OpenAI models response".into());
            }
            Err(format!("OpenAI models request failed: {}", resp.status()).into())
        }
        Provider::Ollama { base_url } => {
            // Ollama exposes /api/models in some installs; try that first
            let url = format!("{}/api/models", base_url.trim_end_matches('/'));
            let resp = client.get(&url).send().await?;
            if resp.status().is_success() {
                let json: serde_json::Value = resp.json().await?;
                // Expecting an array of model names or objects
                if let Some(arr) = json.as_array() {
                    let mut out = vec![];
                    for item in arr {
                        if let Some(s) = item.as_str() {
                            out.push(s.to_string());
                        } else if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
                            out.push(id.to_string());
                        }
                    }
                    return Ok(out);
                }
                // Try extracting `models` key
                if let Some(arr) = json.get("models").and_then(|v| v.as_array()) {
                    let mut out = vec![];
                    for item in arr {
                        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
                            out.push(id.to_string());
                        }
                    }
                    return Ok(out);
                }
                return Err("Unexpected Ollama models response".into());
            }
            Err(format!("Ollama models request failed: {}", resp.status()).into())
        }
        Provider::LMStudio { base_url } => {
            // LMStudio may offer /v1/models similar to OpenAI
            let url = format!("{}/v1/models", base_url.trim_end_matches('/'));
            let resp = client.get(&url).send().await?;
            if resp.status().is_success() {
                let json: serde_json::Value = resp.json().await?;
                if let Some(data) = json.get("data").and_then(|d| d.as_array()) {
                    let mut out = vec![];
                    for item in data {
                        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
                            out.push(id.to_string());
                        }
                    }
                    return Ok(out);
                }
                // Fallback: if the response is an array
                if let Some(arr) = json.as_array() {
                    let mut out = vec![];
                    for item in arr {
                        if let Some(s) = item.as_str() {
                            out.push(s.to_string());
                        } else if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
                            out.push(id.to_string());
                        }
                    }
                    return Ok(out);
                }
                return Err("Unexpected LMStudio models response".into());
            }
            Err(format!("LMStudio models request failed: {}", resp.status()).into())
        }
    }
}

fn log(level: &str, msg: &str) {
    let now = Local::now();
    eprintln!("{} [{}] {}", now.format("%Y-%m-%d %H:%M:%S"), level, msg);
}

// Strip leading/trailing code fences (```json ... ```) or single backticks around model output
fn strip_fences(s: &str) -> String {
    let mut t = s.trim().to_string();

    // Remove triple-backtick fence with optional language identifier
    if t.starts_with("```") && t.ends_with("```") {
        // remove first line if it contains language
        let inner = t.trim_start_matches('`').trim_matches('`').trim().to_string();
        return inner;
    }

    // Remove any leading ```lang\n and trailing ```
    if let Some(idx) = t.find("\n") {
        if t.starts_with("```") {
            let without_first = t.splitn(2, '\n').nth(1).unwrap_or(&t).to_string();
            if without_first.ends_with("```") {
                return without_first.trim_end_matches('`').trim().to_string();
            }
        }
    }

    // Remove single backticks around the whole string
    if t.starts_with('`') && t.ends_with('`') {
        t = t[1..t.len()-1].to_string();
    }

    t
}

async fn call_ollama(base_url: &str, prompt: String, model: Option<String>) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let model_name = model.unwrap_or_else(|| "llama2".to_string());
    let request = OllamaRequest {
        model: model_name,
        prompt,
        stream: false,
        options: Some(OllamaOptions {
            temperature: Some(0.7),
            top_p: Some(0.9),
            max_tokens: Some(2000),
        }),
    };

    let url = format!("{}/api/generate", base_url.trim_end_matches('/'));
    let resp = client.post(&url).json(&request).send().await?;
    let status = resp.status();
    let text = resp.text().await?;

    if status.is_success() {
        // Try to decode into the expected shape, otherwise try a few heuristics
        if let Ok(ollama_response) = serde_json::from_str::<OllamaResponse>(&text) {
            return Ok(strip_fences(&ollama_response.response));
        }

        // Try generic JSON extraction
        if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&text) {
            // Common keys that might contain generated text
            if let Some(s) = json_val.get("response").and_then(|v| v.as_str()) {
                return Ok(strip_fences(s));
            }
            if let Some(s) = json_val.get("text").and_then(|v| v.as_str()) {
                return Ok(strip_fences(s));
            }
            if let Some(s) = json_val.get("output").and_then(|v| v.as_str()) {
                return Ok(strip_fences(s));
            }
            // If output is an array, join textual pieces
            if let Some(arr) = json_val.get("output").and_then(|v| v.as_array()) {
                let mut parts = vec![];
                for item in arr {
                    if let Some(t) = item.get("text").and_then(|v| v.as_str()) {
                        parts.push(t.to_string());
                    } else if let Some(s) = item.as_str() {
                        parts.push(s.to_string());
                    } else {
                        parts.push(item.to_string());
                    }
                }
                if !parts.is_empty() {
                    return Ok(strip_fences(&parts.join("\n\n")));
                }
            }
        }

        // As last resort, return the raw body text (sanitized)
        return Ok(strip_fences(&text));
    } else {
        Err(format!("Ollama API error (status {}): {}", status, text).into())
    }
}

async fn call_openai(api_key: &str, prompt: String, model: Option<String>) -> Result<String, Box<dyn Error>> {
    // Use OpenAI Chat Completions endpoint
    let client = Client::new();
    let model_name = model.unwrap_or_else(|| "gpt-4o-mini".to_string());

    let chat_body = serde_json::json!({
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a creative design fiction generator."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1500
    });

    let resp = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&chat_body)
        .send()
        .await?;

    if resp.status().is_success() {
        let json: serde_json::Value = resp.json().await?;
        // Try to extract the textual content from the standard chat completion shape
        if let Some(choice) = json.get("choices").and_then(|c| c.get(0)) {
            if let Some(message) = choice.get("message") {
                    if let Some(content) = message.get("content") {
                    return Ok(strip_fences(content.as_str().unwrap_or_default()));
                }
            }
        }
        // Fallback: return full JSON as string (sanitized)
        Ok(strip_fences(&json.to_string()))
    } else {
        let error_text = resp.text().await?;
        Err(format!("OpenAI API error: {}", error_text).into())
    }
}

async fn call_lmstudio(base_url: &str, prompt: String, model: Option<String>) -> Result<String, Box<dyn Error>> {
    // LM Studio uses an OpenAI-like API; use /v1/responses endpoint by default
    let client = Client::new();
    let model_name = model.unwrap_or_else(|| "ggml-model".to_string());
    let url = format!("{}/v1/responses", base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model_name,
        "input": prompt,
        "temperature": 0.7,
        "max_output_tokens": 1500
    });

    log("DEBUG", &format!("LMStudio request -> POST {} body {}", url, body));

    let resp = client.post(&url).json(&body).send().await?;
    let status = resp.status();
    let text = resp.text().await?;

    log("DEBUG", &format!("LMStudio response status: {} body: {}", status, text));

    if status.is_success() {
        // Try to parse the Responses API common shapes
        if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&text) {
            // Try `output` array
            if let Some(arr) = json_val.get("output").and_then(|v| v.as_array()) {
                let mut parts = vec![];
                for item in arr {
                    if let Some(txt) = item.get("content").and_then(|c| c.get(0)).and_then(|c0| c0.get("text")).and_then(|t| t.as_str()) {
                        parts.push(txt.to_string());
                    } else if let Some(s) = item.as_str() {
                        parts.push(s.to_string());
                    } else {
                        parts.push(item.to_string());
                    }
                }
                if !parts.is_empty() {
                    return Ok(strip_fences(&parts.join("\n\n")));
                }
            }

            // Try `choices` -> message content
            if let Some(choices) = json_val.get("choices").and_then(|v| v.as_array()) {
                if let Some(first) = choices.get(0) {
                    if let Some(msg) = first.get("message") {
                        if let Some(content) = msg.get("content") {
                            if let Some(arr) = content.as_array() {
                                        for item in arr {
                                            if let Some(txt) = item.get("text").and_then(|t| t.as_str()) {
                                                return Ok(strip_fences(txt));
                                            }
                                        }
                                    } else if let Some(text_s) = content.get("text").and_then(|t| t.as_str()) {
                                        return Ok(strip_fences(text_s));
                                    }
                        }
                    }
                }
            }
        }

                // Fallback: return raw body (sanitized)
                Ok(strip_fences(&text))
    } else {
        Err(format!("LMStudio API error (status {}): {}", status, text).into())
    }
}
