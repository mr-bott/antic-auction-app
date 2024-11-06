
// components/Products/ProductCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const timeLeft = new Date(product.end_time) - new Date();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <img
        src={JSON.parse(product.images)[0]}
        alt={product.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{product.title}</h3>
        <p className="text-gray-600">{product.description}</p>
        <div className="mt-4">
          <p className="text-lg font-bold">
            Current Bid: ${product.current_price}
          </p>
          <p className="text-sm text-gray-500">
            Time Left: {hoursLeft} hours
          </p>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-4 block text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;