# Work Kit of Design Fiction

## What is the Work Kit of Design Fiction?

The Work Kit of Design Fiction is an interactive tool that helps you imagine, create, and explore possible futures. By combining elements like attributes, objects, actions, and archetypes, the kit generates playful and thought-provoking artifacts—stories, objects, or scenarios—that invite you to think differently about technology, society, and everyday life.

Whether you’re a designer, educator, student, or just curious, the Work Kit of Design Fiction offers a hands-on way to spark creativity and conversation. Flip cards, shuffle ideas, and let the kit conjure up speculative artifacts that challenge assumptions and inspire new perspectives.

## How does it work?

- **Flip and shuffle cards**: Choose from decks of attributes, objects, actions, and archetypes. Each card represents a building block for your design fiction.
- **Conjure an artifact**: Once you’ve selected one of each type, the kit uses artificial intelligence to generate a short story, object description, or scenario that combines your choices in a surprising way.
- **Explore and share**: Read the generated artifact, reflect on its implications, and share your favorites with others. Use the kit for workshops, brainstorming, or just for fun!

## Why use the Work Kit of Design Fiction?

- **Spark creativity**: Break out of habitual thinking and discover unexpected ideas.
- **Collaborate and play**: Use the kit in groups to encourage discussion and collective imagination.
- **Learn by making**: Engage with futures thinking, design, and storytelling in a hands-on, accessible way.
- **No technical skills required**: The interface is simple and playful—just flip, shuffle, and conjure!

## Try it out

- [Project page](https://nearfuturelaboratory.com/projects/en/work-kit-of-design-fiction-2023/)
- [Play the 2023 edition](https://nearfuturelaboratory.com/work-kit-of-design-fiction/play-2023-edition/)
- [Educational write-up on Medium](https://proudtaranat.medium.com/the-work-kit-of-design-fiction-educational-games-critique-48ead19acd10)

---

# Technical Appendix

The Work Kit of Design Fiction is built as a modern desktop and web application:

- **Frontend**: Built with React and Tailwind CSS for a responsive, interactive user experience. The card-flipping and shuffling interface is powered by React components.
- **AI Generation**: When you conjure an artifact, the app sends your card selections to a backend that uses large language models (LLMs) like OpenAI, Ollama, or LMStudio to generate a short, structured story or artifact description. The prompt is carefully designed to produce creative, readable, and parseable results.
- **Backend**: For the desktop version, the backend is written in Rust and runs via Tauri, providing a secure and fast bridge between the UI and the AI models. The backend can be adapted to run as a web server for online hosting.
- **Extensibility**: The system is designed to support new card decks, prompt templates, and AI providers with minimal changes.
- **Open Source**: The code is open for remixing, learning, and adaptation.

For more technical details, see the main README or explore the source code.
