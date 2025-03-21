import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import '../styles/cards.css';

const CardFlipper = ({ frontImage, backImage, allImages, onImageChange }) => {
  const [isFlipped, setIsFlipped] = useState(true);
  const [currentFrontImage, setCurrentFrontImage] = useState(frontImage);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [zRotation, setZRotation] = useState(0);
  
  // Use refs to track initialization and prevent unnecessary callbacks
  const isInitialized = useRef(false);
  const prevFrontImage = useRef(frontImage);
  const prevIsFlipped = useRef(isFlipped);

  // Set initial image index ONCE on mount
  useEffect(() => {
    if (!isInitialized.current && frontImage && allImages) {
      const index = allImages.indexOf(frontImage);
      setCurrentImageIndex(index);
      
      // Call onImageChange only once during initialization
      if (onImageChange && index === -1) {
        // Pass the index and flipped state (false for initial render)
        onImageChange(index, true);
      }
      
      isInitialized.current = true;
    }
  }, []);  // Empty dependency array - runs ONLY on mount

  // Handle frontImage prop changes (from parent)
  useEffect(() => {
    // Only run if the prop has actually changed and it's not the initial render
    if (isInitialized.current && frontImage !== prevFrontImage.current) {
      setCurrentFrontImage(frontImage);
      const index = allImages?.indexOf(frontImage) ?? -1;
      
      if (index !== currentImageIndex) {
        setCurrentImageIndex(index);
        
        // Notify parent only when index actually changes
        if (onImageChange && index !== -1) {
          onImageChange(index, isFlipped);
        }
      }
      
      prevFrontImage.current = frontImage;
    }
  }, [frontImage, allImages]); // Only depend on these props

  // Track flipped state changes
  useEffect(() => {
    if (isInitialized.current && isFlipped !== prevIsFlipped.current) {
      // Notify parent about flip state change
      if (onImageChange) {
        // If flipped to back, pass -1 as index to indicate back is showing
        // Otherwise pass the current image index
        onImageChange(isFlipped ? -1 : currentImageIndex, isFlipped);
        console.log(isFlipped);
      }
      prevIsFlipped.current = isFlipped;
    }
  }, [isFlipped]);

  const getRandomRotation = () => {
    return (Math.random() * 4) - 2; // Generates a number between -2 and +2
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);

    // Only update image when flipping to front
    if (isFlipped) { // Note: this is checking the CURRENT state, which is about to be flipped
      // Select a random image when flipping to front
      if (allImages && allImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * allImages.length);
        const newFrontImage = allImages[randomIndex];
        
        setCurrentFrontImage(newFrontImage);
        setCurrentImageIndex(randomIndex);
        
        // The flip state change will trigger the useEffect that calls onImageChange
      }
    }
    // When flipping to back, the useEffect will handle notifying with index -1
  };

  const handleMouseEnter = () => {
    setZRotation(getRandomRotation());
  };

  const handleMouseLeave = () => {
    setZRotation(-1 * getRandomRotation());
  };

  return (
    <motion.div
      className="card"
      onClick={handleCardClick}
      whileHover={{ scale: 1.05, rotateZ: zRotation }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="card-inner"
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.5, ease: 'anticipate' }}
      >
        <motion.div
          style={{ backgroundImage: `url(${backImage})` }}
          className="card-face card-back"
        ></motion.div>
        <motion.div
          style={{ backgroundImage: `url(${currentFrontImage})` }}
          className="card-face card-front"
        ></motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CardFlipper;
