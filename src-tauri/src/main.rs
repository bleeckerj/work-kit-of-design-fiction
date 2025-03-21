// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ollama_client;

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
}

#[derive(Serialize)]
struct GenerateResponse {
    response: String,
    status: String,
}

// Command to generate text from Ollama
#[tauri::command]
async fn generate_design_fiction(args: GeneratePromptArgs) -> Result<GenerateResponse, String> {
    match ollama_client::generate_text(args.prompt, args.model).await {
        Ok(response) => Ok(GenerateResponse {
            response,
            status: "success".to_string(),
        }),
        Err(e) => Err(format!("Failed to generate text: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(CardState(Mutex::new(Vec::new())))
        .invoke_handler(tauri::generate_handler![
            record_shuffle,
            generate_design_fiction
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
