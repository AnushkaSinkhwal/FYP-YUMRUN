import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';

const ProductFeatures = ({ product }) => {
    // Extracting features from product props
    const { features } = product || {};

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            {/* Features Section */}
            {features && features.length > 0 && (
                <div className="mb-6">
                    <h2 className="flex items-center mb-4 text-xl font-semibold text-gray-900">
                        <FaCheckCircle className="mr-2 text-green-600" />
                        Product Features
                    </h2>
                    <ul className="space-y-2">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                                <span className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 mr-2 text-green-500">
                                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </span>
                                <span className="text-gray-700">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Cooking Instructions if available */}
            {product?.cookingInstructions && (
                <div className="mb-6">
                    <h2 className="flex items-center mb-3 text-xl font-semibold text-gray-900">
                        <FaInfoCircle className="mr-2 text-blue-600" />
                        Cooking Instructions
                    </h2>
                    <p className="text-gray-700">{product.cookingInstructions}</p>
                </div>
            )}

            {/* Ingredients list if available */}
            {product?.ingredients && product.ingredients.length > 0 && (
                <div className="mb-6">
                    <h2 className="flex items-center mb-3 text-xl font-semibold text-gray-900">
                        <FaInfoCircle className="mr-2 text-amber-600" />
                        Ingredients
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {product.ingredients.map((ingredient, index) => (
                            <span 
                                key={index}
                                className="px-3 py-1 text-sm rounded-full bg-amber-50 text-amber-800"
                            >
                                {ingredient}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

ProductFeatures.propTypes = {
    product: PropTypes.shape({
        features: PropTypes.arrayOf(PropTypes.string),
        cookingInstructions: PropTypes.string,
        ingredients: PropTypes.arrayOf(PropTypes.string),
        nutritionalInfo: PropTypes.shape({
            calories: PropTypes.number,
            fat: PropTypes.number,
            carbs: PropTypes.number,
            protein: PropTypes.number,
            sodium: PropTypes.number,
            allergens: PropTypes.arrayOf(PropTypes.string)
        })
    }).isRequired
};

export default ProductFeatures; 