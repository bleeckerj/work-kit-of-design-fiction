import React, { useState } from 'react';
import CardFlipper from './CardFlipper';

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
      
      // Only log when there's an actual change
      if (index === -1) {
        console.log(`${type} card is now showing its BACK image`);
      } else {
        console.log(`${type} card is now showing image index: ${index}`);
      }
      
      return {
        ...prev,
        [type]: index
      };
    });
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

      // Reset the flip state after changing images
      document.querySelectorAll('.card-inner').forEach((card) => {
        card.style.transform = '';
      });
    }, 900); // Adjust timeout to match the flip animation duration
  };

  return (
    <div className="container mx-auto mt-10">
      <div
        className="bg-[url('src/assets/images/work-kit/GravitationalCuttingMat_DSC_3739.webp')] bg-cover bg-center 
      bg-no-repeat p-20 rounded-md"
        style={{ boxShadow: '8px 8px 2px black', backgroundSize: '100% 100%' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="w-full h-full flex flex-col items-center">
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
        <div className="mt-4 text-sm text-gray-600">
          <p>Attribute Index: {imageIndices.attribute}</p>
          <p>Action Index: {imageIndices.action}</p>
          <p>Archetype Index: {imageIndices.archetype}</p>
          <p>Object Index: {imageIndices.object}</p>
          <p>Extras Index: {imageIndices.extras}</p>
        </div>
      </div>
    </div>
  );
};

export default ShuffleComponent;
