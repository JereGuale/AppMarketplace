// Función centralizada para formatear precios

export const formatPrice = (price) => {
  if (!price && price !== 0) return '$0.00';
  const priceValue = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(priceValue)) return '$0.00';
  return `$${priceValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const renderStars = (rating = 5) => {
  return '⭐'.repeat(Math.min(Math.max(Math.round(rating), 0), 5));
};
