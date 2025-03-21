import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'

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

  Additional considerations: emerging technologies like Augmented Reality, Artificial Intelligence, Blockchain, Cryptocurrency, Artificial Intelligence, Machine Intelligence and others can be part of the context but should not be "over-determining" factors in the outcome. Consider that they are part of the context but not the sole focus of the design fiction. Consider that they may not be referred to directly (for example, "AI-based camera", "VR headset", "Blockchain-based voting system") but if they are in some world we are imagining, they may be just assumed without having to be explicitly stated, much like we assume "smart phone" when we say "phone" today, or "digital camera" when we say "camera", or "wheels on luggage" (which is assumed) when we say "luggage." We want the context to feel normal, ordinary, everyday and so many "fetish" technologies of today like AI could be so ubiquitous that they are not even mentioned in the design fiction, but implied by the narrative or the description of the artifact.
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

// Replace your editor-related code with this simpler approach
const [editor, setEditor] = useState(null);
const editorRef = useRef(null);

// Initialize the editor when the component mounts
useEffect(() => {
  // Only create the editor if it doesn't already exist and the ref is available
  if (!editor && editorRef.current) {
    console.log("Initializing editor...");
    
    const newEditor = new Editor({
      element: editorRef.current,
      extensions: [StarterKit, TextStyle, Color],
      content: '',
      editorProps: {
        attributes: {
          class: 'text-left w-full p-4',
        },
      },
    });
    
    setEditor(newEditor);
  }
  
  // Clean up the editor when component unmounts
  return () => {
    if (editor) {
      editor.destroy();
    }
  };
}, [editorRef.current]); // Only run when ref changes

// Update editor content when generatedFiction changes
useEffect(() => {
  if (editor && generatedFiction) {
    console.log("Updating editor content with:", generatedFiction.substring(0, 50) + "...");
    
    // Clear existing content
    editor.commands.clearContent();
    
    // Insert content by paragraphs with styling
    const paragraphs = generatedFiction.split('\n');
    
    paragraphs.forEach((paragraph, index) => {
      // Add line breaks between paragraphs
      if (index > 0) {
        editor.commands.insertContent('<br><br>');
      }
      
      // Skip empty paragraphs
      if (!paragraph.trim()) return;
      
      // Insert the paragraph with white text
      editor.commands.insertContent({
        type: 'text',
        text: paragraph,
        marks: [
          {
            type: 'textStyle',
            attrs: {
              color: '#ffffff'
            }
          }
        ]
      });
    });
  } else if (editor && !generatedFiction) {
    // Clear editor when generatedFiction is empty
    editor.commands.clearContent();
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
    {/* <div className="grid grid-cols-2 sm:grid-cols-2 gap-4"> */}
    {/* Left Column (2x2 grid) */}
    <div className="grid grid-cols-4 grid-rows-2 gap-4">
    <div className="card-wrapper">
    <CardFlipper
    isFlipping={isFlipping}  // <-- Add this prop
    frontImage={images.attribute}
    backImage={attributeBackImage}
    allImages={attributeFrontImages}
    onImageChange={(index, isFlipped) => handleImageChange('attribute', index, isFlipped)}
    client:load
    />
    </div>
    <div className="card-wrapper">
    <CardFlipper
    isFlipping={isFlipping}  // <-- Add this prop
    frontImage={images.archetype}
    backImage={archetypeBackImage}
    allImages={archetypeFrontImages}
    onImageChange={(index, isFlipped) => handleImageChange('archetype', index, isFlipped)}
    client:load
    />
    </div>
    <div className="card-wrapper">
    <CardFlipper
    isFlipping={isFlipping}  // <-- Add this prop
    frontImage={images.object}
    backImage={objectBackImage}
    allImages={objectFrontImages}
    onImageChange={(index, isFlipped) => handleImageChange('object', index, isFlipped)}
    client:load
    />
    </div>
    <div className="card-wrapper">
    <CardFlipper
    isFlipping={isFlipping}  // <-- Add this prop
    frontImage={images.action}
    backImage={actionBackImage}
    allImages={actionFrontImages}
    onImageChange={(index, isFlipped) => handleImageChange('action', index, isFlipped)}
    client:load
    />
    {/* </div> */}
    </div>
    {/* Right Column (single div) */}
    <div className="sm:max-w-5/12 md:max-w-8/12 h-full flex flex-col items-center">
    <div className="card-wrapper flex justify-center mb-auto mt-auto w-full">
    <CardFlipper
    isFlipping={isFlipping}  
    frontImage={images.extras}
    backImage={extrasBackImage}
    allImages={extrasFrontImages}
    onImageChange={(index, isFlipped) => handleImageChange('extras', index, isFlipped)}
    client:load
    />
    </div>
    </div>
    </div>
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
        <div className="mt-10">
        <div className="mb-10">
        <button 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        onClick={generateAIPrompt}
        disabled={isGenerating}
        >
        {isGenerating ? "Conjuring..." : "Conjure"}
        </button>
        </div>
        
        {/* Use ref instead of id */}
        <div ref={editorRef} className="diagnostics bg-blue-700 rounded-sm p-4">
          {/* Editor will be initialized here */}
        </div>
        
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
        <div className="font-bold mb-2">Design Context:</div>
        
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
          <div  className="mt-4 p-6 border-4 border-blue-200 bg-blue-50 rounded">
          <div className="font-bold text-lg mb-4">Generated Design Fiction:</div>
          <div id="generated-design-fiction" className="prose text-left">
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
