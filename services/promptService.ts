export const buildPrompt = (nodeId: string, baseDescription: string): string => {
  const desc = baseDescription.trim() || "an object";

  switch (nodeId) {
    case 'angle':
      return `Highly detailed professional product photo of ${desc}, taken from a dramatic different camera angle, suitable for high-end advertising, consistent cinematic lighting.`;
    
    case 'zoom':
      return `Extreme close-up macro shot of the details of ${desc}, sharp focus on texture and mechanics, shallow depth of field, product marketing photography.`;
    
    case 'part':
      return `Isolated product render of the core engine or mechanical components of ${desc} on a clean white background, exploded view style for catalog listing.`;
    
    case 'rotate':
      return `Side profile view of ${desc}, perfectly centered, studio lighting, white cyclorama background, automotive photography style.`;
    
    case 'creative':
      return `Creative cyberpunk neon version of ${desc} in a futuristic city at night, vibrant pink and blue lighting, wet pavement reflections, cinematic composition.`;
    
    case 'technical':
      return `Technical blueprint line-art diagram of ${desc}, white lines on distinct blue background, labeled style, architectural drawing, vector aesthetics.`;
    
    case '3d':
      return `3D isometric render of ${desc}, soft ambient occlusion shadows, clay render style, minimal matte material, product visualization.`;
    
    case 'cartoon':
      return `Cartoon illustration of ${desc}, bold black outlines, flat vibrant colors, cel-shaded, friendly style for kids marketing material.`;
    
    default:
      return `A high quality photo of ${desc}.`;
  }
};