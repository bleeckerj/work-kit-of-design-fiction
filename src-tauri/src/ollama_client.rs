use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::error::Error;

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
pub struct OllamaResponse {
    pub model: String,
    pub response: String,
}

pub async fn generate_text(prompt: String, model: Option<String>) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    
    // Default to llama2 model if none specified
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

    let response = client.post("http://localhost:11434/api/generate")
        .json(&request)
        .send()
        .await?;
    
    if response.status().is_success() {
        let ollama_response: OllamaResponse = response.json().await?;
        Ok(ollama_response.response)
    } else {
        let error_text = response.text().await?;
        Err(format!("Ollama API error: {}", error_text).into())
    }
}