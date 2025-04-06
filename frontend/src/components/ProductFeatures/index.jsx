import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';

const ProductFeatures = ({ features, nutritionalInfo }) => {
    // Default data if not provided
    const defaultFeatures = [
        "Fresh ingredients sourced locally",
        "Made-to-order for maximum freshness",
        "No artificial preservatives",
        "Gluten-free options available",
        "Customizable toppings and ingredients"
    ];

    const defaultNutritionalInfo = {
        calories: 285,
        fat: 10.5,
        carbs: 34,
        protein: 15,
        sodium: 520,
        allergens: ["Wheat", "Dairy"]
    };

    const displayFeatures = features || defaultFeatures;
    const displayNutrition = nutritionalInfo || defaultNutritionalInfo;

    return (
        <div className="product-features bg-white rounded-lg">
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaInfoCircle className="mr-2 text-indigo-600" />
                    Nutritional Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Calories</p>
                        <p className="text-gray-900 font-bold text-xl">{displayNutrition.calories}</p>
                        <p className="text-gray-500 text-xs">kcal</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Fat</p>
                        <p className="text-gray-900 font-bold text-xl">{displayNutrition.fat}g</p>
                        <p className="text-gray-500 text-xs">Total</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Carbs</p>
                        <p className="text-gray-900 font-bold text-xl">{displayNutrition.carbs}g</p>
                        <p className="text-gray-500 text-xs">Total</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Protein</p>
                        <p className="text-gray-900 font-bold text-xl">{displayNutrition.protein}g</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Sodium</p>
                        <p className="text-gray-900 font-bold text-xl">{displayNutrition.sodium}mg</p>
                    </div>
                </div>

                {displayNutrition.allergens && displayNutrition.allergens.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-md font-medium text-gray-800 mb-2">Allergens:</h3>
                        <div className="flex flex-wrap gap-2">
                            {displayNutrition.allergens.map((allergen, index) => (
                                <span 
                                    key={index}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                                >
                                    {allergen}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaCheckCircle className="mr-2 text-green-600" />
                    Ingredients & Details
                </h2>
                <ul className="space-y-2">
                    {displayFeatures.map((feature, index) => (
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
        </div>
    );
};

ProductFeatures.propTypes = {
    features: PropTypes.arrayOf(PropTypes.string),
    nutritionalInfo: PropTypes.shape({
        calories: PropTypes.number,
        fat: PropTypes.number,
        carbs: PropTypes.number,
        protein: PropTypes.number,
        sodium: PropTypes.number,
        allergens: PropTypes.arrayOf(PropTypes.string)
    })
};

export default ProductFeatures; 