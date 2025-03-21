// src/App.jsx
import React from 'react';
import ShuffleComponent from './components/ShuffleComponent';
import './App.css';

// Import your images
import attributeBackImage from './assets/images/extras/attribute_back_image.webp';
import objectBackImage from './assets/images/extras/object_back_image.webp';
import actionBackImage from './assets/images/extras/action_back_image.webp';
import archetypeBackImage from './assets/images/extras/archetype_back_image.webp';
import extrasBackImage from './assets/images/extras/hq_production_2023_MJ__.webp';

// Dynamically import all front images - use literals directly, not a function
const attributeFrontImages = Object.values(
  import.meta.glob('./assets/images/attribute/*.{png,webp,jpg,jpeg,svg}', { eager: true })
).map(module => module.default);

const actionFrontImages = Object.values(
  import.meta.glob('./assets/images/action/*.{png,webp,jpg,jpeg,svg}', { eager: true })
).map(module => module.default);

const archetypeFrontImages = Object.values(
  import.meta.glob('./assets/images/archetype/*.{png,webp,jpg,jpeg,svg}', { eager: true })
).map(module => module.default);

const objectFrontImages = Object.values(
  import.meta.glob('./assets/images/object/*.{png,webp,jpg,jpeg,svg}', { eager: true })
).map(module => module.default);

const extrasFrontImages = Object.values(
  import.meta.glob('./assets/images/extras/weights/*.{png,webp,jpg,jpeg,svg}', { eager: true })
).map(module => module.default);

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <main>
        <ShuffleComponent
          attributeFrontImages={attributeFrontImages}
          actionFrontImages={actionFrontImages}
          archetypeFrontImages={archetypeFrontImages}
          objectFrontImages={objectFrontImages}
          extrasFrontImages={extrasFrontImages}
          attributeBackImage={attributeBackImage}
          actionBackImage={actionBackImage}
          archetypeBackImage={archetypeBackImage}
          objectBackImage={objectBackImage}
          extrasBackImage={extrasBackImage}
        />
      </main>
    </div>
  );
}

export default App;