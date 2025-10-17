// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ollama_client;
mod llm_client;

use tauri::State;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

// Define a structure to hold state if needed
struct CardState(Mutex<Vec<String>>);

// Define your shuffle command
#[tauri::command]
fn record_shuffle(state: State<CardState>) -> Result<String, String> {
    let mut cards = state.0.lock().unwrap();
    cards.push(format!("Cards shuffled at: {}", chrono::Local::now().to_rfc3339()));
    
    println!("Cards were shuffled! Total shuffles: {}", cards.len());
    Ok(format!("Shuffle recorded! Total: {}", cards.len()))
}

#[derive(Deserialize)]
struct GeneratePromptArgs {
    prompt: String,
    model: Option<String>,
    provider: Option<String>,
    base_url: Option<String>,
}

#[derive(Serialize)]
struct GenerateResponse {
    response: String,
    status: String,
}

// Command to generate text from Ollama
#[tauri::command]
async fn generate_design_fiction(args: GeneratePromptArgs) -> Result<GenerateResponse, String> {
    // Load environment variables from .env (development)
    dotenvy::dotenv().ok();

    // Determine provider preference: args.provider > env LLM_PROVIDER > default 'ollama'
    let provider_name = args.provider
        .clone()
        .or_else(|| std::env::var("LLM_PROVIDER").ok())
        .unwrap_or_else(|| "ollama".to_string());

    // Construct Provider
    let provider = match provider_name.as_str() {
        "openai" => {
            match std::env::var("OPENAI_API_KEY") {
                Ok(key) => llm_client::Provider::OpenAI { api_key: key },
                Err(_) => return Err("OPENAI_API_KEY not set in environment".to_string()),
            }
        }
        "lmstudio" => {
            let base = args.base_url
                .clone()
                .or_else(|| std::env::var("LMSTUDIO_URL").ok())
                .unwrap_or_else(|| "http://localhost:11400".to_string());
            llm_client::Provider::LMStudio { base_url: base }
        }
        _ => {
            let base = args.base_url
                .clone()
                .or_else(|| std::env::var("OLLAMA_URL").ok())
                .unwrap_or_else(|| "http://localhost:11434".to_string());
            llm_client::Provider::Ollama { base_url: base }
        }
    };

    match llm_client::generate(provider, args.prompt, args.model).await {
        Ok(response) => Ok(GenerateResponse { response, status: "success".to_string() }),
        Err(e) => Err(format!("Failed to generate text: {}", e)),
    }
}

#[derive(Deserialize)]
struct ListModelsArgs {
    provider: Option<String>,
    base_url: Option<String>,
}

// List available models for a provider (best effort)
#[tauri::command]
async fn list_models(args: ListModelsArgs) -> Result<Vec<String>, String> {
    dotenvy::dotenv().ok();

    let provider_name = args.provider
        .clone()
        .or_else(|| std::env::var("LLM_PROVIDER").ok())
        .unwrap_or_else(|| "ollama".to_string());
    eprintln!("list_models called with provider: {} base_url: {:?}", provider_name, args.base_url);

    let provider = match provider_name.as_str() {
        "openai" => {
            match std::env::var("OPENAI_API_KEY") {
                Ok(key) => llm_client::Provider::OpenAI { api_key: key },
                Err(_) => return Err("OPENAI_API_KEY not set in environment".to_string()),
            }
        }
        "lmstudio" => {
            let base = args.base_url
                .clone()
                .or_else(|| std::env::var("LMSTUDIO_URL").ok())
                .unwrap_or_else(|| "http://localhost:11400".to_string());
            llm_client::Provider::LMStudio { base_url: base }
        }
        _ => {
            let base = args.base_url
                .clone()
                .or_else(|| std::env::var("OLLAMA_URL").ok())
                .unwrap_or_else(|| "http://localhost:11434".to_string());
            llm_client::Provider::Ollama { base_url: base }
        }
    };

    match llm_client::list_models_for_provider(provider).await {
        Ok(list) => {
            eprintln!("list_models succeeded, returning {} models", list.len());
            Ok(list)
        }
        Err(e) => {
            eprintln!("list_models failed: {}", e);
            Err(format!("Failed to list models: {}", e))
        }
    }
}

fn main() {
    // Suppress noisy macOS CoreAnimation / unified log lines during development.
    // Setting OS_ACTIVITY_MODE=disable hides many system log messages that clutter stdout/stderr.
    // Note: this disables much of the system unified logging for this process — useful while
    // developing, but you may want to remove it if you need to see system logs.
    std::env::set_var("OS_ACTIVITY_MODE", "disable");
    tauri::Builder::default()
        .manage(CardState(Mutex::new(Vec::new())))
        .invoke_handler(tauri::generate_handler![
            record_shuffle,
            generate_design_fiction,
            list_models
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
