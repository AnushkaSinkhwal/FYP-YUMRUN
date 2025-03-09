import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { MdClose } from "react-icons/md";
import Rating from '@mui/material/Rating';
import { useContext } from 'react';
import { IoCartSharp } from "react-icons/io5";
import QuantityBox from '../QuantityBox';

import { MyContext } from '../../App';
import ProductZoom from '../ProductZoom';

const ProductModel = () => {

    const context = useContext(MyContext);

    // Example ingredients list
    const ingredients = ["Tomato", "Mozzarella", "Basil", "Olives", "Pepperoni"];

    return (
        <Dialog 
            open={context.isOpenProductModel} 
            className="ProductModel" 
            onClose={() => context.setIsOpenProductModel(false)}
        >
            <Button className='close_' onClick={() => context.setIsOpenProductModel(false)}>
                <MdClose />
            </Button>

            <h4 className="mb-1 font-weight-bold">Fire and Ice Pizza</h4>

            <div className='d-flex align-items-center'>
                <div className='d-flex align-items-center mr-4'>
                    <span>Restaurant:</span>
                    <span className='ml-2'><b>Namaste</b></span>
                </div>
                <Rating
                    className="mt-2 mb-2"
                    name="read-only"
                    value={5}
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
                        <span className='oldPrice lg mr-2'>Rs.650</span>
                        <span className='netPrice text-danger lg'>Rs.520</span>
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
                        <QuantityBox />
                       
                    </div>

                    {/* Action Buttons */}
                    <div className='d-flex align-items-center mt-5 actions'>
                        {/* Add to Cart Button */}
                        <Button className='btn-blue btn-lg btn-big btn-round ml-3'  variant="outlined"> 
                            <IoCartSharp /> Add to cart
                        </Button>
                        <Button className='btn-blue btn-lg btn-big btn-round ml-3' variant="outlined"   sx={{ ml: 1 }} >
                            <IoCartSharp /> &nbsp; ORDER HERE
                        </Button>
                        
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ProductModel;
