import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'

//import { getCurrent, WebviewWindow } from '@tauri-apps/api/window';


import React, { useState, useEffect } from 'react';
import CardFlipper from './CardFlipper';
import { 
  attributeDescriptions, 
  archetypeDescriptions, 
  objectDescriptions,
  actionDescriptions,
  extrasDescriptions
} from '../data/cardDescriptions';

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

  // Update the current description for a specific card type
  const updateDescriptionForType = (type, index) => {
    setCurrentDescriptions(prev => ({
      ...prev,
      [type]: index === -1 ? "" : getDescriptionForType(type, index)
    }));
  };

  const shuffleCards = () => {
    // Flip all cards
    document.querySelectorAll('.card-inner').forEach((card) => {
      card.style.transform = 'rotateY(180deg)';
    });

    // Wait for the flip animation to complete, then shuffle images
    setTimeout(() => {
      setImages({
        attribute: getRandomImage(attributeFrontImages),
        action: getRandomImage(actionFrontImages),
        archetype: getRandomImage(archetypeFrontImages),
        object: getRandomImage(objectFrontImages),
        extras: getRandomImage(extrasFrontImages),
      });

      // Reset indices - they'll be updated via the onImageChange callbacks
      setImageIndices({
        attribute: -1,
        action: -1,
        archetype: -1,
        object: -1,
        extras: -1
      });

      // Reset descriptions
      setCurrentDescriptions({
        attribute: "",
        action: "",
        archetype: "",
        object: "",
        extras: ""
      });

      // Reset the flip state after changing images
      document.querySelectorAll('.card-inner').forEach((card) => {
        card.style.transform = '';
      });
    }, 900); // Adjust timeout to match the flip animation duration
  };

  // Add a function to get the full card info
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
    
    // Return the complete description object if it exists
    if (index < descriptions.length) {
      if (typeof descriptions[index] === 'object' && descriptions[index] !== null) {
        return descriptions[index];
      } else {
        // Create an object for string values
        return {
          name: descriptions[index],
          description: descriptions[index],
          context: ""
        };
      }
    }
    
    return null;
  };

  // Function to format prompts according to Llama 3's expected format
  const formatLlamaPrompt = (elements) => {
    const { attributeInfo, actionInfo, archetypeInfo, objectInfo, extrasInfo } = elements;
    
    return `<|system|>
  You are a creative design fiction generator who helps designers imagine speculative future products and services. Your task is to create plausible near-future scenarios that integrate the provided elements in coherent and thought-provoking ways.
  
  Do not mention a time horizon or year. Focus on the design and its social implications. Do not make the explication sound too futuristic or science-fictional. Do not over-index on specific technology ("AI" or "VR" or "AR") unless it is in very generic terms. COnsider technical jargon as useful indicators of future contexts, implications of contexts external to the design (eg regulatory contexts, policy or governance requirements, regulations, specifications, data standards, and related jargon-laced contexts.)
  
  Consider the practice of Design Fiction as a way to imply future contexts through artifacts — products, services, mundane quotidian objects - that are imbued with social, cultural, and political meaning.
  
  Provide a user experience scenario or description that is both plausible and provocative, grounded in the elements provided.

Consider providing the implications in the form of something like a product advertisement, or product packaging copy, or excerpts from user manuals, or product reviews, or a classified advertisement, or a product pitch for investment, or a bad web advertisement, or an influencer's script, or user feedback, or FAQ items, or news articles, or other forms of documentation.

  Provide a meta commentary on the Design Fiction, reflecting on the process of creating the design fiction, the elements you chose, and the implications of the design fiction. Your meta commentary should not use first-person pronouns. Present in abstract terms, without reference to yourself. Headline the meta commentary as "Commentary".

  Consider the [OUTCOME] loosely in this context to characterize the perceived value of the design fiction from excellent to very poor such that, for example, a product review for a poor [OUTCOME] would indicate disappointment or frustration, while a product review for an excellent [OUTCOME] would indicate overwhelming satisfaction or delight.

  The design fiction format is like a "MadLibs" sentence: A [ATTRIBUTE] [OBJECT] that [ACTION]s like a [ARCHETYPE] with [OUTCOME] characteristics. This is a general template to guide your narrative but not a requirement. Be creative and have fun with your scenario.
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
  
  Based on these cards, create a compelling design fiction narrative - a plausible near-future product or service that combines all elements. Format as 2 paragraphs: first describing what this design is and how it works, second explaining its implications for users and society.
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

  // Add state for the editor instance
  const [editor, setEditor] = useState(null);
  
  // Initialize the editor after the component mounts
  useEffect(() => {
    // Find the element
    const element = document.querySelector('#chat-editor');
    
    if (element) {
      // Create the editor
      const newEditor = new Editor({
        element,
        autofocus: true,
        editable: true,
        extensions: [
          StarterKit,
          TextStyle,
          Color,
        ],
      });
      
      setEditor(newEditor);
      
      // Clean up on unmount
      return () => {
        if (newEditor) {
          newEditor.destroy();
        }
      };
    }
  }, []); // Empty dependency array means this runs once on mount
  
  // Then in another useEffect, update content when generatedFiction changes
  useEffect(() => {
    if (generatedFiction && editor) {
      // Clear editor first
      editor.commands.clearContent();
      
      // Insert new content with styling
      editor.commands.insertContent({
        type: 'text',
        text: generatedFiction,
        marks: [
          {
            type: 'textStyle',
            attrs: {
              color: '#ffffff'
            }
          }
        ]
      });
    }
  }, [generatedFiction, editor]);

  return (
    <div className="container mx-auto mt-10">
      {/* <div
        className="bg-[url('src/assets/images/work-kit/GravitationalCuttingMat_DSC_3739.webp')] bg-cover bg-center 
      bg-no-repeat p-20 rounded-md"
        style={{ boxShadow: '8px 8px 2px black',     backgroundSize: 'contain', // This maintains original proportions
          backgroundColor: '#f5f5f5', // Add a background color for any empty space
          minHeight: '200px'}}
      > */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          {/* Left Column (2x2 grid) */}
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
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
          {/* Right Column (single div) */}
          <div className="sm:max-w-5/12 md:max-w-8/12 h-full flex flex-col items-center">
            <div className="flex justify-center mb-auto mt-auto w-full">
              <button
                onClick={shuffleCards}
                onMouseEnter={handleMouseEnter}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                style={{ ...buttonStyle, fontFamily: 'InputMono' }}
                className="bg-white text-black px-4 py-2 w-[190px] h-[60px] rounded-none border-2 border-solid border-black"
              >
                Hit Me!
              </button>
            </div>
            <div className="my-2"></div>
            <div className="card-wrapper flex justify-center mb-auto mt-auto w-full">
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
        {/* If you want to display the current indices for testing: */}
        {
          console.log(imageIndices.attribute, imageIndices.archetype, imageIndices.object, imageIndices.action, imageIndices.extras)
        }
        
        {/* <div className="mt-4 text-sm text-gray-600 bg-amber-100">
          <h3 className="font-bold mb-2">Current Card Combination:</h3>
          <p>Attribute: {imageIndices.attribute === -1 ? "Card is flipped" : currentDescriptions.attribute}</p>
          <p>Action: {imageIndices.action !== -1 ? currentDescriptions.action : "Card is flipped"}</p>
          <p>Archetype: {imageIndices.archetype !== -1 ? currentDescriptions.archetype : "Card is flipped"}</p>
          <p>Object: {imageIndices.object !== -1 ? currentDescriptions.object : "Card is flipped"}</p>
          <p>Extras: {imageIndices.extras !== -1 ? currentDescriptions.extras : "Card is flipped"}</p>
        </div> */}
        {/* NEW: Show descriptions */}
        {allCardsVisible && (
        <div id="chat-editor" class="diagnostics bg-blue-700 rounded-sm">
          {/* <div class="diagnostics bg-blue-700 rounded-sm mb-2"></div> */}
        </div>
        )}

        {allCardsVisible && (
          <div className="mt-4 p-4 border-2 border-gray-200 rounded bg-gray-50">
            <h3 className="font-bold mb-2">Card Descriptions:</h3>
            
            {imageIndices.attribute !== -1 && (
              <div className="mb-2">
                <p className="font-semibold">Attribute: {getFullCardInfoForType('attribute', imageIndices.attribute)?.name}</p>
                <p className="text-sm italic ml-4">{getFullCardInfoForType('attribute', imageIndices.attribute)?.description}</p>
              </div>
            )}
            
            {imageIndices.action !== -1 && (
              <div className="mb-2">
                <p className="font-semibold">Action: {getFullCardInfoForType('action', imageIndices.action)?.name}</p>
                <p className="text-sm italic ml-4">{getFullCardInfoForType('action', imageIndices.action)?.description}</p>
              </div>
            )}
            
            {imageIndices.archetype !== -1 && (
              <div className="mb-2">
                <p className="font-semibold">Archetype: {getFullCardInfoForType('archetype', imageIndices.archetype)?.name}</p>
                <p className="text-sm italic ml-4">{getFullCardInfoForType('archetype', imageIndices.archetype)?.description}</p>
              </div>
            )}
            
            {imageIndices.object !== -1 && (
              <div className="mb-2">
                <p className="font-semibold">Object: {getFullCardInfoForType('object', imageIndices.object)?.name}</p>
                <p className="text-sm italic ml-4">{getFullCardInfoForType('object', imageIndices.object)?.description}</p>
              </div>
            )}
            
            {imageIndices.extras !== -1 && (
              <div className="mb-2">
                <p className="font-semibold">Outcome: {getFullCardInfoForType('extras', imageIndices.extras)?.name}</p>
                <p className="text-sm italic ml-4">{getFullCardInfoForType('extras', imageIndices.extras)?.description}</p>
              </div>
            )}
          </div>
        )}



        {/* NEW: Show context information (optional, could be toggled) */}
        {allCardsVisible && (
          <div className="mt-4 p-4 border-l-4 border-blue-300 bg-blue-50">
            <h3 className="font-bold mb-2">Design Context:</h3>
            
            {imageIndices.attribute !== -1 && (
              <div className="mb-3">
                <p className="font-semibold">Attribute Context:</p>
                <p className="text-sm ml-4">{getFullCardInfoForType('attribute', imageIndices.attribute)?.context}</p>
              </div>
            )}
            
            {imageIndices.object !== -1 && (
              <div className="mb-3">
                <p className="font-semibold">Object Context:</p>
                <p className="text-sm ml-4">{getFullCardInfoForType('object', imageIndices.object)?.context}</p>
              </div>
            )}
            
            {imageIndices.action !== -1 && (
              <div className="mb-3">
                <p className="font-semibold">Action Context:</p>
                <p className="text-sm ml-4">{getFullCardInfoForType('action', imageIndices.action)?.context}</p>
              </div>
            )}
            
            {imageIndices.archetype !== -1 && (
              <div className="mb-3">
                <p className="font-semibold">Archetype Context:</p>
                <p className="text-sm ml-4">{getFullCardInfoForType('archetype', imageIndices.archetype)?.context}</p>
              </div>
            )}
            
            {imageIndices.extras !== -1 && (
              <div className="mb-3">
                <p className="font-semibold">Outcome Context:</p>
                <p className="text-sm ml-4">{getFullCardInfoForType('extras', imageIndices.extras)?.context}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Your existing design fiction generator */}
        <div className="mt-8 p-4 border-2 border-black bg-white">
          <div className="font-bold text-lg mb-4">Current Design Fiction:</div>
          {allCardsVisible ? (
            
            <p className="text-lg">
              A <span className="font-bold text-white">{currentDescriptions.attribute}</span>{" "}
              <span className="font-bold">{currentDescriptions.object}</span> that{" "}
              <span className="font-bold">{currentDescriptions.action}s</span> like a{" "}
              <span className="font-bold">{currentDescriptions.archetype}</span> with{" "}
              <span className="font-bold">{currentDescriptions.extras}</span> characteristics.
            </p>

          ) : (
            <p>Flip all cards to reveal the complete design fiction prompt.</p>
          )}
          
        </div>
        
        {/* You could also add a button to generate AI content using the full context */}
        {allCardsVisible && (
          <div className="mt-8">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              onClick={generateAIPrompt}
              disabled={isGenerating}
            >
              {isGenerating ? "Conjuring..." : "Conjure"}
            </button>
            
            {generatedFiction && (
              <div className="mt-4 p-6 border-4 border-blue-200 bg-blue-50 rounded">
                <div className="font-bold text-lg mb-4">Generated Design Fiction:</div>
                <div className="prose text-left">
                  {generatedFiction.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    // </div>
  );
};

export default ShuffleComponent;
