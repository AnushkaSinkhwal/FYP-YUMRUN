import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { MdClose } from "react-icons/md";
import Rating from '@mui/material/Rating';
import { useContext, useState } from 'react';
import { IoCartSharp } from "react-icons/io5";
import QuantityBox from '../QuantityBox';
import { useCart } from '../../context/CartContext';

import { MyContext } from '../../App';
import ProductZoom from '../ProductZoom';

const ProductModel = () => {
    const context = useContext(MyContext);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);

    // Example ingredients list
    const ingredients = ["Tomato", "Mozzarella", "Basil", "Olives", "Pepperoni"];
    
    // Example product details - in a real app, this would come from props or context
    const product = {
        id: '1',
        name: 'Fire and Ice Pizza',
        restaurant: 'Namaste',
        rating: 5,
        oldPrice: 650,
        newPrice: 520,
        image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg'
    };
    
    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.newPrice,
            image: product.image,
            rating: product.rating,
            restaurant: product.restaurant
        }, quantity);
        
        // Close the modal after adding to cart
        context.setIsOpenProductModel(false);
    };
    
    const handleOrderNow = () => {
        // Add to cart first
        handleAddToCart();
        
        // Then redirect to cart page (would use react-router here)
        window.location.href = '/cart';
    };

    return (
        <Dialog 
            open={context.isOpenProductModel} 
            className="ProductModel" 
            onClose={() => context.setIsOpenProductModel(false)}
        >
            <Button className='close_' onClick={() => context.setIsOpenProductModel(false)}>
                <MdClose />
            </Button>

            <h4 className="mb-1 font-weight-bold">{product.name}</h4>

            <div className='d-flex align-items-center'>
                <div className='d-flex align-items-center mr-4'>
                    <span>Restaurant:</span>
                    <span className='ml-2'><b>{product.restaurant}</b></span>
                </div>
                <Rating
                    className="mt-2 mb-2"
                    name="read-only"
                    value={product.rating}
                    readOnly
                    size="small"
                    precision={0.5}
                />
            </div>

            <hr />

            <div className='row mt-2 productDetailModel'>
                <div className='col-md-5'>
                    <ProductZoom/>
                </div>

                <div className='col-md-7'>
                    <div className='d-flex info align-items-center mb-3'>
                        <span className='oldPrice lg mr-2'>Rs.{product.oldPrice}</span>
                        <span className='netPrice text-danger lg'>Rs.{product.newPrice}</span>
                    </div>

                    <p className="mt-3">Hi, I am Anushka.</p>

                    {/* Ingredients Section */}
                    <div className='ingredients-section mt-3'>
                        <h5>Ingredients Used:</h5>
                        <ul className='ingredients-list'>
                            {ingredients.map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                        </ul>
                    </div>

                    <div className='d-flex align-items-center'>
                        <QuantityBox 
                            initialValue={quantity} 
                            onChange={(newQuantity) => setQuantity(newQuantity)}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className='d-flex align-items-center mt-5 actions'>
                        {/* Add to Cart Button */}
                        <Button 
                            className='btn-blue btn-lg btn-big btn-round ml-3'  
                            variant="outlined"
                            onClick={handleAddToCart}
                        > 
                            <IoCartSharp /> Add to cart
                        </Button>
                        <Button 
                            className='btn-blue btn-lg btn-big btn-round ml-3' 
                            variant="outlined"   
                            sx={{ ml: 1 }}
                            onClick={handleOrderNow}
                        >
                            <IoCartSharp /> &nbsp; ORDER HERE
                        </Button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ProductModel;
