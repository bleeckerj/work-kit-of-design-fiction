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
  actionDescriptions,
  extrasDescriptions
} from '../data/cardDescriptions';
import EditorComponent from './EditorComponent';
import JSONEditorComponent from './JSONEditorComponent';

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
  extrasFrontImages,
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
    extras: getRandomImage(extrasFrontImages),
  });
  
  // Track the current indices of each card
  const [imageIndices, setImageIndices] = useState({
    attribute: -1,
    action: -1,
    archetype: -1,
    object: -1,
    extras: -1
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
    object: "",
    extras: ""
  });
  
  const [generatedFiction, setGeneratedFiction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2");
  
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
      case 'extras':
      descriptions = extrasDescriptions;
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
      case 'extras':
      descriptions = extrasDescriptions;
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
      case 'extras':
      descriptions = extrasDescriptions;
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
  const extrasCardRef = useRef();
  
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
      const newExtrasImage = getRandomImage(extrasFrontImages);
      
      // Set new images
      setImages({
        attribute: newAttributeImage,
        action: newActionImage,
        archetype: newArchetypeImage,
        object: newObjectImage,
        extras: newExtrasImage,
      });
      
      // Find indices
      const attributeIndex = attributeFrontImages.indexOf(newAttributeImage);
      const actionIndex = actionFrontImages.indexOf(newActionImage);
      const archetypeIndex = archetypeFrontImages.indexOf(newArchetypeImage);
      const objectIndex = objectFrontImages.indexOf(newObjectImage);
      const extrasIndex = extrasFrontImages.indexOf(newExtrasImage);
      
      // Update indices and descriptions
      setImageIndices({
        attribute: attributeIndex,
        action: actionIndex,
        archetype: archetypeIndex,
        object: objectIndex,
        extras: extrasIndex
      });
      
      setCurrentDescriptions({
        attribute: getDescriptionForType('attribute', attributeIndex),
        action: getDescriptionForType('action', actionIndex),
        archetype: getDescriptionForType('archetype', archetypeIndex),
        object: getDescriptionForType('object', objectIndex),
        extras: getDescriptionForType('extras', extrasIndex)
      });
      
      
      // //Flip all cards back after another short delay
      // setTimeout(() => {
        //   setIsFlipping(true);
      // }, 1000);
    }, 500);  
  };
  
  // Function to format prompts according to Llama 3's expected format
  const formatLlamaPrompt = (elements) => {
    const { attributeInfo, actionInfo, archetypeInfo, objectInfo, extrasInfo } = elements;
    
    return `<|system|>
  You are a creative design fiction generator who helps designers imagine speculative future products and services. Your task is to create plausible near-future scenarios that integrate the provided elements in coherent and thought-provoking ways.
  
  Do not mention a time horizon or year. Focus on the design and its social implications. Do not make the explication sound too futuristic or science-fictional. Do not over-index on specific technology ("AI" or "VR" or "AR") unless it is in very generic terms. COnsider technical jargon as useful indicators of future contexts, implications of contexts external to the design (eg regulatory contexts, policy or governance requirements, regulations, specifications, data standards, and related jargon-laced contexts.)
  
  Consider the practice of Design Fiction as a way to imply future contexts through artifacts — products, services, mundane quotidian objects - that are imbued with social, cultural, and political meaning.
  
  Provide a user experience scenario or description that is both plausible and provocative, grounded in the elements provided.
  
The [ARCHETYPE] is "${archetypeInfo.name}" and is how the Design Fiction concept is represented as an artifact — an item that one might find in the world. 
    
The [ARCHETYPE] description is "${archetypeInfo.description}" and explains how the concept should be represented as an artifact. 
    
For example 'Magazine Article' indicates that we are meant to represent this concept in the form of a prose-based magazine article. 'Embroidered Patch' indicates that our concept should be implied through the form of a physical patch that could be sewn onto a garment. Such might indicate affiliation with a group or club, or achievement of a goal, or as a decoration or fashion statement.
  
  Provide a meta commentary on the Design Fiction, reflecting on the process of creating the design fiction, the elements you chose, and the implications of the design fiction. Your meta commentary should not use first-person pronouns. Present in abstract terms, without reference to yourself.
    
  When developing the Design Fiction concept and artifact, consider relevant cultural, social, and technological trends for which this Design Fiction might be a response or a reflection. Consider the implications of these trends on the Design Fiction and the context in which it exists.
    
  Consider the [OUTCOME] loosely in this context to characterize the perceived value of the design fiction from excellent to very poor such that, for example, a product review for a poor [OUTCOME] would indicate disappointment or frustration, while a product review for an excellent [OUTCOME] would indicate overwhelming satisfaction or delight.
  
  The design fiction format is like a "MadLibs" sentence: A [ATTRIBUTE] [OBJECT] that [ACTION]s like a [ARCHETYPE] with [OUTCOME] characteristics. This is a general template to guide your narrative but not a requirement. Be creative and have fun with your scenario.
    
  Additional considerations: emerging technologies like Augmented Reality, Artificial Intelligence, Blockchain, Cryptocurrency, Artificial Intelligence, Machine Intelligence and others can be part of the context but should not be "over-determining" factors in the outcome. Consider that they are part of the context but not the sole focus of the design fiction. 
  
  Consider that they may not be referred to directly (for example, "AI-based camera", "VR headset", "Blockchain-based voting system") but if they are in some world we are imagining, they may be just assumed without having to be explicitly stated, much like we assume "smart phone" when we say "phone" today, or "digital camera" when we say "camera", or "wheels on luggage" (which is assumed) when we say "luggage." We want the context to feel normal, ordinary, everyday and so many "fetish" technologies of today like AI could be so ubiquitous that they are not even mentioned in the design fiction, but implied by the narrative or the description of the artifact.

  Do not refer to anything as "AI-powered" or "VR-enabled" or "Blockchain-based"<div className=""></div>
  <|user|>
  I've drawn these cards from a design fiction deck:
  
  ATTRIBUTE: ${attributeInfo.name}
  ${attributeInfo.description}
  ${attributeInfo.context}
  
  OBJECT: ${objectInfo.name}
  ${objectInfo.description}
  ${objectInfo.context}
  
  ACTION: ${actionInfo.name}
  ${actionInfo.description}
  ${actionInfo.context}
  
  ARCHETYPE: ${archetypeInfo.name}
  ${archetypeInfo.description}
  ${archetypeInfo.context}
  
  OUTCOME: ${extrasInfo.name}
  ${extrasInfo.description}
  ${extrasInfo.context}
  
  Based on these cards, create a compelling description of the design fiction artifact in the form of a ${archetypeInfo.name}. Do so as a plausible near-future product or service in the form of a ${archetypeInfo.name} that combines all elements. 
  
  Describe the ${archetypeInfo.name} in a way that is both plausible and provocative, grounded in the elements provided.
    
  Also provide a narrative or user scenario or description or quotidian 'scene' that is both plausible and provocative, grounded in the elements provided.
    
  Format your response as JSON that includes structured data indicating the ATTRIBUTE, OBJECT, ACTION, ARCHETYPE, OUTCOME specific creative and imaginative responses.
    
  Only produce JSON data. DO NOT include any additional remarks or comments that are not in the JSON structure. The JSON structure is machine readable and any additional text will cause the system to reject the response or cause an error. All errors are to be avoided.
  
  In the JSON schema should also be included as additional elements:
    * Artifact Description: The description of the artifact in the form of a ${archetypeInfo.name}. (Be complete and expansive with the description. Describe what this design fiction is and how it works. 
    * User Scenario: A user scenario narrative that gives additional context and meaning to the Design Fiction. Use prose-based narrative description like a scene from a short story or movie script.
    * Implications: Explain its implications for users, society, and culture Consider social, cultural, technological trends that this Design Fiction implies.
    * Additional:
      1. Meta Commentary: what are some additional reflections on the artifact from a business, cultural, brand, or design perspective? 
      2. Reasoning: why are these elements important to the design fiction and helpful for imagining future products and services and their implications for innovation and design?
      3. Trends: what are some relevant cultural, social, and technological trends that this Design Fiction might be a response or a reflection of?
    
  Be sure that your entire response is in JSON format, with no additional text or comments outside of the JSON object. If there is material that does not fit into the Zod schema, please include it in the JSON object as a comment or additional information with the key "comment" and the value as a string.
    
  A Zod schema for your JSON response is:
    
  z.object({
    elements: z.object({
      ATTRIBUTE: z.string(),
      OBJECT: z.string(),
      ACTION: z.string(),
      ARCHETYPE: z.string(),
      OUTCOME: z.string()
    }),
    artifact: z.object({
      title: z.string(),
      description: z.string()
    }),
    design: z.object({
      artifact_description: z.string()
    }),
    implications: z.object({
      social: z.string(),
      cultural: z.string(),
      ethical: z.string().optional()
    }),
    scenario: z.object({
      narrative: z.string(),
    }),
    additional: z.object({
      meta_commentary: z.string(),
      reasoning: z.string(),
      trends: z.string()
    })
  })
    
  <|assistant|>`;
  };
  
  // Updated generateAIPrompt function
  const generateAIPrompt = async () => {
    if (!allCardsVisible) {
      alert("Please flip all cards to generate a design fiction");
      return;
    }
    
    setIsGenerating(true);
    
    // Get the full info for all visible cards
    const attributeInfo = getFullCardInfoForType('attribute', imageIndices.attribute);
    const actionInfo = getFullCardInfoForType('action', imageIndices.action);
    const archetypeInfo = getFullCardInfoForType('archetype', imageIndices.archetype);
    const objectInfo = getFullCardInfoForType('object', imageIndices.object);
    const extrasInfo = getFullCardInfoForType('extras', imageIndices.extras);
    
    // Format the prompt according to the model's requirements
    const elements = { attributeInfo, actionInfo, archetypeInfo, objectInfo, extrasInfo };
    const prompt = formatLlamaPrompt(elements);
    
    try {
      console.log("Sending prompt to Ollama:", prompt);
      
      const result = await invoke('generate_design_fiction', {
        args: {
          prompt: prompt,
          model: selectedModel
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
  imageIndices.object !== -1 && 
  imageIndices.extras !== -1;

  // Add this state near your other state variables
  const [editorType, setEditorType] = useState('rich'); // 'rich' or 'json'
  
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

          {/* Fifth card - reduce margin */}
          <div className="flex justify-center mb-4">
            <div className="card-wrapper">
              <CardFlipper
                frontImage={images.extras}
                backImage={extrasBackImage}
                allImages={extrasFrontImages}
                onImageChange={(index, isFlipped) => handleImageChange('extras', index, isFlipped)}
                client:load
              />
            </div>
          </div>
        </div>

        {/* Right column: Editor - touch right edge */}
        <div className="editor-column px-2 flex flex-col min-h-full overflow-y-auto overflow-x-visible w-full border-l border-gray-300"> 
          
          {/* Editor is always visible */}
          <div className="editor-wrapper h-0 flex-1 min-h-0 overflow-auto">
            {/* Editor type selector */}
            <div className="flex justify-end mb-1">
              <div className="inline-flex rounded-md shadow-sm" role="group">
              {allCardsVisible && (
            <div className="mb-0">
              <button 
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm w-32"
                onClick={generateAIPrompt}
                disabled={isGenerating}
              >
                <span className="inline-block text-center relative">
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

                <button 
                  type="button"
                  onClick={() => setEditorType('rich')}
                  className={`px-2 py-1 text-xs font-medium rounded-l-lg ${
                    editorType === 'rich' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Rich Text
                </button>
                <button 
                  type="button"
                  onClick={() => setEditorType('json')}
                  className={`px-2 py-1 text-xs font-medium rounded-r-lg ${
                    editorType === 'json' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>
            
            {/* Render the appropriate editor based on selection */}
            {editorType === 'rich' ? (
              <EditorComponent 
                content={generatedFiction || ""} 
                placeholder={
                  isGenerating ? 
                    <span className="relative">
                      Conjuring
                      <span className="absolute left-full">{loadingDots}</span>
                    </span> : 
                    "Click 'Conjure' to generate design fiction"
                }
                isGenerating={isGenerating}
              />
            ) : (
              <JSONEditorComponent 
                content={generatedFiction || ""} 
                placeholder={
                  isGenerating ? 
                    <span className="relative">
                      Conjuring
                      <span className="absolute left-full">{loadingDots}</span>
                    </span> : 
                    "Click 'Conjure' to generate design fiction"
                }
                isGenerating={isGenerating}
                onChange={(jsonString) => {
                  // Optionally handle changes to the JSON
                  // setGeneratedFiction(jsonString);
                }}
              />
            )}
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
              {imageIndices.extras !== -1 && (
                <div className="mb-1">
                  <p className="font-semibold">Outcome: {getFullCardInfoForType('extras', imageIndices.extras)?.name}</p>
                  <p className="text-xs italic ml-2">{getFullCardInfoForType('extras', imageIndices.extras)?.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicator - reduce margin and padding */}
      <div className="mt-2 p-2 border-[0.5px] border-black bg-white w-full">
        {allCardsVisible ? (
          <div className="bg-gray-200 p-1 rounded-md text-xs font-mono">
            A {currentDescriptions.attribute}{" "}{currentDescriptions.object}{" "}that{" "}{currentDescriptions.action}{" "}like a{" "}{currentDescriptions.archetype}{" "}with{" "}{currentDescriptions.extras}{" "}characteristics.
          </div>
        ) : (
          <div className="w-full text-center text-sm">Flip cards to reveal design fiction prompt.</div>
        )}
      </div>
    </div>
  );
};

export default ShuffleComponent;
