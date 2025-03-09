import Rating from '@mui/material/Rating';
import { BsArrowsFullscreen } from "react-icons/bs";
import Button from '@mui/material/Button';
import { CiHeart } from "react-icons/ci";
import { useContext } from 'react';
import { MyContext } from '../../App';
import PropTypes from 'prop-types';

const ProductItem = (props) => {

    const context = useContext(MyContext);
    const viewProductDetails = () => {
        context.setIsOpenProductModel(true);
    };

    return (
        <>
            <div className={`productItem ${props.itemView}`}>
                <div className="imgWrapper">
                    <img 
                        src="https://fmdadmin.foodmandu.com//Images/Vendor/269/Logo/web_240423103631_200624060757.listing-fire-and-ice.png" 
                        className="w-100" 
                        alt="Product Logo"
                    />
                    <span className="badge badge-primary">20%</span>
                </div>  
                <div className="info">
                    <h4>Fire And Ice Pizzeria - Bhaktapur</h4>
                    
                    <Rating 
                        className="mt-2 mb-2" 
                        name="read-only" 
                        value={5} 
                        readOnly 
                        size="small" 
                        precision={0.5} 
                    />
                    <div className="d-flex">
                        <span className="oldPrice">Rs.650</span>
                        <span className="netPrice text-danger ml-2">Rs.520</span>
                        <div className="actions">
                            <Button onClick={viewProductDetails}>
                                <BsArrowsFullscreen/> 
                            </Button>
                            <Button>
                                <CiHeart style={{ fontSize: '20px' }}/> 
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Prop validation for itemView
ProductItem.propTypes = {
    itemView: PropTypes.string.isRequired,
};

export default ProductItem;
