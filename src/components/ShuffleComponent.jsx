import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
// import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';
// import { Editor } from '@tiptap/core'
// import StarterKit from '@tiptap/starter-kit'
// import TextStyle from '@tiptap/extension-text-style'
// import Color from '@tiptap/extension-color'

//import { getCurrent, WebviewWindow } from '@tauri-apps/api/window';


import React, { useState, useEffect, useRef } from 'react';
import CardFlipper from './CardFlipper';
import { 
  attributeDescriptions, 
  archetypeDescriptions, 
  objectDescriptions,
  actionDescriptions
} from '../data/cardDescriptions';
import ResponseViewer from './ResponseViewer';

const getRandomImage = (images) => {
  if (!images || images.length === 0) {
    console.error('getRandomImage: No images available', images);
    return null;
  }
  return images[Math.floor(Math.random() * images.length)];
};

const ShuffleComponent = ({
  attributeFrontImages,
  actionFrontImages,
  archetypeFrontImages,
  objectFrontImages,
  attributeBackImage,
  objectBackImage,
  actionBackImage,
  archetypeBackImage,
  extrasBackImage,
}) => {
  const [images, setImages] = useState({
    attribute: getRandomImage(attributeFrontImages),
    action: getRandomImage(actionFrontImages),
    archetype: getRandomImage(archetypeFrontImages),
    object: getRandomImage(objectFrontImages),
    // extras removed
  });
  
  // Track the current indices of each card
  const [imageIndices, setImageIndices] = useState({
    attribute: -1,
    action: -1,
    archetype: -1,
    object: -1,
    // extras removed
  });
  
  const [buttonStyle, setButtonStyle] = useState({
    backgroundColor: 'white',
    color: 'black',
    boxShadow: '5px 5px rgba(0, 0, 0, 0)',
  });
  
  // Add state for current descriptions
  const [currentDescriptions, setCurrentDescriptions] = useState({
    attribute: "",
    action: "",
    archetype: "",
    object: ""
  });
  
  const [generatedFiction, setGeneratedFiction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // provider/model selection (persisted to localStorage)
  const [provider, setProvider] = useState(() => localStorage.getItem('llm_provider') || 'ollama');
  const [providerBaseUrl, setProviderBaseUrl] = useState(() => localStorage.getItem('llm_base_url') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('llm_model') || 'gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState(null); // null = unknown / not provided by backend
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState(null);
  
  // Add this state and effect for animating the loading dots
  const [loadingDots, setLoadingDots] = useState('');
  
  // Set up an interval to animate the dots when isGenerating is true
  useEffect(() => {
    let dotsInterval;
    if (isGenerating) {
      // Start the animation
      dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '....') return '.';
          if (prev === '...') return '....';
          if (prev === '..') return '...';
          if (prev === '.') return '..';
          return '.';
        });
      }, 400); // Change dots every 400ms for a nice rhythm
    }
    
    // Clean up the interval when isGenerating becomes false
    return () => {
      if (dotsInterval) clearInterval(dotsInterval);
    };
  }, [isGenerating]);

  // persist provider/model/base_url to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('llm_provider', provider);
      localStorage.setItem('llm_base_url', providerBaseUrl);
      localStorage.setItem('llm_model', selectedModel);
    } catch (e) {
      // ignore quota errors in some environments
    }
  }, [provider, providerBaseUrl, selectedModel]);

  // Fetch available models from the backend for the selected provider/base_url
  const fetchAvailableModels = async (prov = provider, base = providerBaseUrl) => {
    setIsFetchingModels(true);
    try {
      // Backend command 'list_models' is optional; gracefully handle failure
      // Tauri command functions expect the args under an `args` key (we use the same shape as generate_design_fiction)
      const res = await invoke('list_models', { args: { provider: prov, base_url: base } });
      let models = null;
      if (Array.isArray(res)) models = res;
      else if (res && Array.isArray(res.models)) models = res.models;

      if (models && models.length > 0) {
        setAvailableModels(models);
        setModelFetchError(null);
        // If current selectedModel isn't in list, adopt the first available model
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } else {
        setAvailableModels(null);
        setModelFetchError('No models returned by provider');
      }
    } catch (err) {
      // Provide clearer logging for troubleshooting (missing API key, invalid base URL, wrong args shape, etc.)
      console.warn('Could not fetch models from backend:', err);
      setAvailableModels(null);
      try {
        const msg = err && err.toString ? err.toString() : JSON.stringify(err);
        setModelFetchError(msg);
      } catch (e) {
        setModelFetchError('Unknown error fetching models');
      }
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    // Try to fetch models when provider or base URL changes
    fetchAvailableModels(provider, providerBaseUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, providerBaseUrl]);
  
  const handleMouseDown = () => {
    setButtonStyle({
      backgroundColor: 'rgb(0 255 70)',
      color: 'black',
      boxShadow: '1px 1px black',
    });
  };
  
  const handleMouseUp = () => {
    setButtonStyle({
      backgroundColor: 'white',
      color: 'black',
      boxShadow: '5px 5px black',
    });
  };
  
  const handleMouseEnter = () => {
    setButtonStyle({
      backgroundColor: 'rgb(208 255 81)',
      color: 'black',
      boxShadow: '3px 3px black',
    });
  };
  
  const handleMouseLeave = () => {
    setButtonStyle({
      backgroundColor: 'white',
      color: 'black',
      boxShadow: '5px 5px black',
    });
  };
  
  const handleImageChange = (type, index, isFlipped = false) => {
    // Clear generated fiction whenever a card changes state
    setGeneratedFiction("");
    
    // Only update if the index has actually changed
    setImageIndices(prev => {
      if (prev[type] === index) {
        return prev; // No change
      }
      
      // Update descriptions based on new index
      if (index === -1) {
        // Card is showing its back, clear the description
        updateDescriptionForType(type, index);
        console.log(`${type} card is now showing its BACK image`);
      } else {
        // Card is showing its front, update the description
        updateDescriptionForType(type, index);
        const description = getDescriptionForType(type, index);
        console.log(`${type} card is now showing image index: ${index}, description: ${description}`);
      }
      
      return {
        ...prev,
        [type]: index
      };
    });
  };
  
  // Helper function to get description for a specific card type and index
  const getDescriptionForType = (type, index) => {
    if (index === -1) return ""; // Card is showing back image
    
    let descriptions;
    switch (type) {
      case 'attribute':
      descriptions = attributeDescriptions;
      break;
      case 'action':
      descriptions = actionDescriptions;
      break;
      case 'archetype':
      descriptions = archetypeDescriptions;
      break;
      case 'object':
      descriptions = objectDescriptions;
      break;
      default:
      return "";
    }
    
    // Check if we have a valid description at this index
    if (index < descriptions.length) {
      // Handle both object format and string format
      if (typeof descriptions[index] === 'object' && descriptions[index] !== null) {
        return descriptions[index].name;
      } else {
        return descriptions[index]; // Handle legacy string format
      }
    }
    
    return `Unknown ${type}`;
  };
  
  // Get the full card info for context and LLM integration
  const getFullCardInfo = (type, index) => {
    if (index === -1) return null; // Card is showing back image
    
    let descriptions;
    switch (type) {
      case 'attribute':
      descriptions = attributeDescriptions;
      break;
      case 'action':
      descriptions = actionDescriptions;
      break;
      case 'archetype':
      descriptions = archetypeDescriptions;
      break;
      case 'object':
      descriptions = objectDescriptions;
      break;
      default:
      return null;
    }
    
    // Check if we have a valid description at this index
    if (index < descriptions.length) {
      // Handle both object format and string format
      if (typeof descriptions[index] === 'object' && descriptions[index] !== null) {
        return descriptions[index];
      } else {
        // Create a simple object for legacy string format
        return { 
          name: descriptions[index],
          description: descriptions[index],
          context: ""
        };
      }
    }
    
    return null;
  };
  
  // Add this function to your component
  const getFullCardInfoForType = (type, index) => {
    if (index === -1) return null; // Card is showing back image
    
    let descriptions;
    switch (type) {
      case 'attribute':
      descriptions = attributeDescriptions;
      break;
      case 'action':
      descriptions = actionDescriptions;
      break;
      case 'archetype':
      descriptions = archetypeDescriptions;
      break;
      case 'object':
      descriptions = objectDescriptions;
      break;
      default:
      return null;
    }
    
    // Check if we have a valid description at this index
    if (index < descriptions.length) {
      // Handle both object format and string format
      if (typeof descriptions[index] === 'object' && descriptions[index] !== null) {
        return descriptions[index];
      } else {
        // Create a simple object for legacy string format
        return { 
          name: descriptions[index],
          description: descriptions[index],
          context: ""
        };
      }
    }
    
    return null;
  };
  
  // Update the current description for a specific card type
  const updateDescriptionForType = (type, index) => {
    setCurrentDescriptions(prev => ({
      ...prev,
      [type]: index === -1 ? "" : getDescriptionForType(type, index)
    }));
  };
  
  // Create refs for each card
  const attributeCardRef = useRef();
  const archetypeCardRef = useRef();
  const objectCardRef = useRef();
  const actionCardRef = useRef();
  
  // Add a state to track flipping
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Update the shuffle function
  const shuffleCards = () => {
    
    console.log('Shuffling cards...');
    // Manually set all cards to flipped=true
    setGeneratedFiction("");
    // Flip all cards
    console.log('Flipping all cards...');
    //setIsFlipping(true);
    document.querySelectorAll('.card-inner').forEach((card) => {
      card.style.transform = 'rotateY(0deg)';
    });
    // Wait for animation
    setTimeout(() => {
      // Update images while cards are flipped
      const newAttributeImage = getRandomImage(attributeFrontImages);
      const newActionImage = getRandomImage(actionFrontImages);
      const newArchetypeImage = getRandomImage(archetypeFrontImages);
      const newObjectImage = getRandomImage(objectFrontImages);
      // Set new images
      setImages({
        attribute: newAttributeImage,
        action: newActionImage,
        archetype: newArchetypeImage,
        object: newObjectImage,
      });
      
      // Find indices
      const attributeIndex = attributeFrontImages.indexOf(newAttributeImage);
      const actionIndex = actionFrontImages.indexOf(newActionImage);
      const archetypeIndex = archetypeFrontImages.indexOf(newArchetypeImage);
      const objectIndex = objectFrontImages.indexOf(newObjectImage);
      // Update indices and descriptions
      setImageIndices({
        attribute: attributeIndex,
        action: actionIndex,
        archetype: archetypeIndex,
        object: objectIndex,
        // extras removed
      });
      
      setCurrentDescriptions({
        attribute: getDescriptionForType('attribute', attributeIndex),
        action: getDescriptionForType('action', actionIndex),
        archetype: getDescriptionForType('archetype', archetypeIndex),
        object: getDescriptionForType('object', objectIndex),
        // extras removed
      });
      
      
      // //Flip all cards back after another short delay
      // setTimeout(() => {
        //   setIsFlipping(true);
      // }, 1000);
    }, 500);  
  };
  
  // Function to format prompts according to Llama 3's expected format
  const formatLlamaPrompt = (elements) => {
    const { attributeInfo, actionInfo, archetypeInfo, objectInfo } = elements;
    
    
  // Use a JS-safe template string: avoid embedding raw backtick characters which would terminate
  // the surrounding template literal.
  return `<|system|>
You are a creative design-fiction generator. Produce exactly one JSON object and nothing else. The object should describe a small speculative artifact created by combining the provided cards.

Lead sentence requirement:
Include a short lead sentence that follows this pattern (fill the slots):
"I saw a <ARCHETYPE>. It seemed to be for an <OBJECT> that does <ACTION> while it also <ATTRIBUTE>."
Replace the angle-bracketed tokens with the corresponding card values and adjust articles ("a" vs "an") so the sentence reads naturally. This exact sentence should appear verbatim (with replaced values) as the opening line of the artifact description or as the first sentence of the scenario.

Guidance:
- Treat ARCHETYPE as the presentation form (e.g., receipt, magazine blurb, product label, patch description). Use that form for the artifact text and formatting cues.
- Ensure the artifact makes clear how the OBJECT performs the ACTION and how the ATTRIBUTE is a salient quality of that object.
- Be concise, plausible, evocative. Prefer social/design implications over technical speculation. Avoid first-person reflection beyond the lead sentence.

Context (fill these using the provided values):
ARCHETYPE: ${archetypeInfo.name}
ARCHETYPE_DESCRIPTION: ${archetypeInfo.description}

ATTRIBUTE: ${attributeInfo.name}
ATTRIBUTE_DESCRIPTION: ${attributeInfo.description}

OBJECT: ${objectInfo.name}
OBJECT_DESCRIPTION: ${objectInfo.description}

ACTION: ${actionInfo.name}
ACTION_DESCRIPTION: ${actionInfo.description}

Formatting and required output:
- Respond with exactly one JSON object and nothing else. Do NOT include any explanatory text.
- Do NOT wrap the JSON in Markdown fences or backticks.
- If a field cannot be supplied, include it with an empty string value.

Required JSON schema (return all fields):
{
  "elements": { "ATTRIBUTE": "", "OBJECT": "", "ACTION": "", "ARCHETYPE": "" },
  "artifact": { "title": "", "description": "" },
  "design": { "artifact_description": "" },
  "implications": { "social": "", "cultural": "", "ethical": "" },
  "scenario": { "narrative": "" },
  "additional": { "meta_commentary": "", "reasoning": "", "trends": "" }
}

Use the ARCHETYPE as the presentation form for the Artifact (for example: a receipt, a product label, a short ad, a magazine blurb, a patch description, etc.). Make the artifact and scenario readable in that form.

Now produce the JSON object that conforms to the schema above.`;
  };
  
  // Updated generateAIPrompt function
  const generateAIPrompt = async () => {
    if (!allCardsVisible) {
      alert("Please flip all cards to generate a design fiction");
      return;
    }
    // Require a model selected from the backend-provided list
    if (!(Array.isArray(availableModels) && availableModels.length > 0 && selectedModel)) {
      alert('No available model selected. Please refresh the model list or set a valid provider/base URL.');
      return;
    }

    setIsGenerating(true);
    
    // Get the full info for all visible cards
    const attributeInfo = getFullCardInfoForType('attribute', imageIndices.attribute);
    const actionInfo = getFullCardInfoForType('action', imageIndices.action);
    const archetypeInfo = getFullCardInfoForType('archetype', imageIndices.archetype);
    const objectInfo = getFullCardInfoForType('object', imageIndices.object);
    
  // Format the prompt according to the model's requirements
  const elements = { attributeInfo, actionInfo, archetypeInfo, objectInfo };
    const prompt = formatLlamaPrompt(elements);
    
    try {
      console.log("Sending prompt to Ollama:", prompt);
      
      const result = await invoke('generate_design_fiction', {
        args: {
          prompt: prompt,
          model: selectedModel,
          provider: provider,
          base_url: providerBaseUrl
        }
      });
      
      console.log("Received response:", result);
      setGeneratedFiction(result.response);
    } catch (error) {
      console.error('Error generating design fiction:', error);
      setGeneratedFiction("Error: Could not generate design fiction. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Check if all cards are showing their front images
  const allCardsVisible = 
  imageIndices.attribute !== -1 && 
  imageIndices.action !== -1 && 
  imageIndices.archetype !== -1 && 
  imageIndices.object !== -1;

  // EditorType removed — always show rich editor
  
  return (
    // Update the outer container to remove padding and margins
    <div className=" bg-gray-200 flex flex-col h-screen max-h-screen overflow-hidden p-0 m-0 w-full">
      {/* Main layout: two-column grid - extend to edges */}
      <div className="main-layout-grid grid flex-1 overflow-hidden
            grid-cols-1 
            sm:grid-cols-[460px_1fr] 
            gap-0
            w-full">

        {/* Left column: Card deck - maintain fixed width but touch edge */}
        <div className="card-deck-column flex flex-col overflow-auto 
                  w-full sm:w-[460px] 
                  shrink-0 bg-gray-200 pt-8 px-2"> 
          {/* Card grid - reduce margins and padding */}
          <div className="grid grid-cols-2 gap-1 sm:gap-0 mb-2">
            <div className="card-wrapper">
              <CardFlipper
                frontImage={images.attribute}
                backImage={attributeBackImage}
                allImages={attributeFrontImages}
                onImageChange={(index, isFlipped) => handleImageChange('attribute', index, isFlipped)}
                client:load
              />
            </div>
            <div className="card-wrapper">
              <CardFlipper
                frontImage={images.archetype}
                backImage={archetypeBackImage}
                allImages={archetypeFrontImages}
                onImageChange={(index, isFlipped) => handleImageChange('archetype', index, isFlipped)}
                client:load
              />
            </div>
            <div className="card-wrapper">
              <CardFlipper
                frontImage={images.object}
                backImage={objectBackImage}
                allImages={objectFrontImages}
                onImageChange={(index, isFlipped) => handleImageChange('object', index, isFlipped)}
                client:load
              />
            </div>
            <div className="card-wrapper">
              <CardFlipper
                frontImage={images.action}
                backImage={actionBackImage}
                allImages={actionFrontImages}
                onImageChange={(index, isFlipped) => handleImageChange('action', index, isFlipped)}
                client:load
              />
            </div>
          </div>

          {/* extras/outcome card removed */}
        </div>

        {/* Right column: Editor - touch right edge */}
        <div className="editor-column px-2 flex flex-col min-h-full overflow-y-auto overflow-x-visible w-full border-l border-gray-300"> 
          
          {/* Editor is always visible */}
          <div className="h-full flex-1 min-h-0 overflow-auto">
            {/* Editor type selector */}
            <div className="flex justify-end mb-1">
              <div className="inline-flex rounded-md shadow-sm" role="group">
              {allCardsVisible && (
            <div className="mb-0">
              <button 
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 text-sm w-fit"
                onClick={generateAIPrompt}
                disabled={isGenerating || !(Array.isArray(availableModels) && availableModels.length > 0 && selectedModel)}
              >
                <span className="inline-block text-center relative font-mono text-sm">
                  {isGenerating ? (
                    <>
                      Conjuring
                      <span className="absolute left-full">
                        {loadingDots}
                      </span>
                    </>
                  ) : (
                    "Conjure"
                  )}
                </span>
              </button>
            </div>
          )}

              {/* Provider / Model controls */}
              <div className="ml-2 flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="provider" className="sr-only">Provider</label>
                  <div className="relative inline-block">
                    <select
                      id="provider"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="font-mono text-[0.8em] appearance-none text-xs px-2 py-1 border rounded bg-white pr-6 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      aria-label="LLM provider"
                    >
                      <option value="ollama">Ollama (local)</option>
                      <option value="openai">OpenAI</option>
                      <option value="lmstudio">LMStudio</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="w-3 h-3 text-gray-700" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* <input
                    type="text"
                    placeholder="Base URL (optional)"
                    value={providerBaseUrl}
                    onChange={(e) => setProviderBaseUrl(e.target.value)}
                    className="text-xs px-2 py-1 border rounded bg-white w-44 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label="Provider base URL"
                  /> */}
                </div>

                <div className="flex items-center space-x-2">
                  {isFetchingModels ? (
                    <div className="text-xs px-2 py-1 text-gray-600">Loading models...</div>
                  ) : availableModels && availableModels.length > 0 ? (
                    <div className="relative inline-block">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="font-mono text-[0.8em] appearance-none text-xs px-2 py-1 border rounded bg-white pr-6 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label="Model"
                      >
                        {availableModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="w-3 h-3 text-gray-700" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="text-xs px-2 py-1 text-red-600">No models available.</div>
                          {modelFetchError && (
                            <div className="text-xs px-2 py-1 text-gray-600">{modelFetchError}</div>
                          )}
                        </div>
                      )}

                      {/* // <button
                      //   onClick={() => { console.log('Refreshing models for', provider, providerBaseUrl); fetchAvailableModels(); }}
                      //   title="Refresh model list"
                      //   className="text-xs px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200"
                      // >
                      //   Refresh
                      // </button> */}
                </div>
              </div>
                  {provider === 'openai' && modelFetchError && modelFetchError.toLowerCase().includes('openai_api_key') && (
                    <div className="mt-1 text-xs text-yellow-700">OpenAI requires an API key set in `src-tauri/.env` (OPENAI_API_KEY). See `.env.example`.</div>
                  )}

                {/* Editor toggle removed to save space; rich editor is always shown */}
              </div>
            </div>
            
            {/* Render the appropriate editor based on selection */}
            <div className="h-full flex-1 min-h-0">
              <ResponseViewer content={generatedFiction || ""} />
            </div>
          </div>

          {/* Card Descriptions - only show when cards are visible */}
          {allCardsVisible && (
            <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 text-xs">
              <h3 className="font-bold mb-1">Card Descriptions:</h3>
              
              {/* Descriptions - make more compact */}
              {imageIndices.attribute !== -1 && (
                <div className="mb-1">
                  <p className="font-semibold">Attribute: {getFullCardInfoForType('attribute', imageIndices.attribute)?.name}</p>
                  <p className="text-xs italic ml-2">{getFullCardInfoForType('attribute', imageIndices.attribute)?.description}</p>
                </div>
              )}
              {imageIndices.action !== -1 && (
                <div className="mb-1">
                  <p className="font-semibold">Action: {getFullCardInfoForType('action', imageIndices.action)?.name}</p>
                  <p className="text-xs italic ml-2">{getFullCardInfoForType('action', imageIndices.action)?.description}</p>
                </div>
              )}
              {imageIndices.archetype !== -1 && (
                <div className="mb-1">
                  <p className="font-semibold">Archetype: {getFullCardInfoForType('archetype', imageIndices.archetype)?.name}</p>
                  <p className="text-xs italic ml-2">{getFullCardInfoForType('archetype', imageIndices.archetype)?.description}</p>
                </div>
              )}
              {imageIndices.object !== -1 && (
                <div className="mb-1">
                  <p className="font-semibold">Object: {getFullCardInfoForType('object', imageIndices.object)?.name}</p>
                  <p className="text-xs italic ml-2">{getFullCardInfoForType('object', imageIndices.object)?.description}</p>
                </div>
              )}
              {/* extras/outcome removed from descriptions */}
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicator - reduce margin and padding */}
      <div className="mt-2 p-2 border-[0.5px] border-black bg-white w-full">
        {allCardsVisible ? (
            <div className="bg-gray-200 p-1 rounded-md text-xs font-mono">
            A {currentDescriptions.attribute}{" "}{currentDescriptions.object}{" "}that{" "}{currentDescriptions.action}{" "}like a{" "}{currentDescriptions.archetype}{" "}characteristics.
          </div>
        ) : (
          <div className="w-full text-center text-sm">Flip cards to reveal design fiction prompt.</div>
        )}
      </div>
    </div>
  );
};

export default ShuffleComponent;
