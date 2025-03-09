import { useState, useRef } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { emphasize, styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Rating from '@mui/material/Rating';
import { FaCloudUploadAlt } from "react-icons/fa";
import Button from '@mui/material/Button';

// Breadcrumb styling
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor = theme.palette.mode === 'light'
        ? theme.palette.grey[100]
        : theme.palette.grey[800];

    return {
        backgroundColor,
        height: theme.spacing(3),
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightRegular,
        '&:hover, &:focus': {
            backgroundColor: emphasize(backgroundColor, 0.06),
        },
        '&:active': {
            boxShadow: theme.shadows[1],
            backgroundColor: emphasize(backgroundColor, 0.12),
        },
    };
});

const ProductUpload = () => {
    const [categoryVal, setCategoryVal] = useState('');
    const [ratingsValue, setRatingValue] = useState(1);
    const [productImagesArr, setProductImages] = useState([]);
    const [isFeaturedValue, setIsFeaturedValue] = useState(false);

    const productImages = useRef();

    const handleChangeCategory = (event) => {
        setCategoryVal(event.target.value);
    };

    const handleChangeIsFeaturedValue = (event) => {
        setIsFeaturedValue(event.target.value);
    };

    const addProductImages = () => {
        if (productImages.current.value) {
            setProductImages([...productImagesArr, productImages.current.value]);
            productImages.current.value = ""; // Clear input after adding
        }
    };

    return (
        <>
            <div className="right-content w-100">
                <div className="card shadow border-0 w-100 flex-row p-4 res-col">
                    <h5 className="mb-0">Food Product Upload</h5>
                    <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
                        <StyledBreadcrumb component="a" href="#" label="Dashboard" icon={<HomeIcon fontSize="small" />} />
                        <StyledBreadcrumb component="a" label="Food Products" href="#" deleteIcon={<ExpandMoreIcon />} />
                        <StyledBreadcrumb label="Food Product Upload" deleteIcon={<ExpandMoreIcon />} />
                    </Breadcrumbs>
                </div>

                <form className='form'>
                    <div className='row'>
                        <div className='col-sm-9'>
                            <div className='card p-4'>
                                <h5 className='mb-4'>Basic Information</h5>
                                <div className='form-group'>
                                    <h6>PRODUCT NAME</h6>
                                    <input type='text' name="name" placeholder="e.g., Veg Burger" />
                                </div>
                                <div className='form-group'>
                                    <h6>DESCRIPTION</h6>
                                    <textarea rows={5} placeholder="A delicious and healthy veggie burger made with fresh ingredients." />
                                </div>
                                <div className='row'>
                                    <div className='col'>
                                        <div className='form-group'>
                                            <h6>CATEGORY</h6>
                                            <Select value={categoryVal} onChange={handleChangeCategory} displayEmpty className='w-100'>
                                                <MenuItem value=""><em>None</em></MenuItem>
                                                <MenuItem value="Veg">Veg</MenuItem>
                                                <MenuItem value="Non-Veg">Non-Veg</MenuItem>
                                                <MenuItem value="Fast-food">Fast-Food</MenuItem>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className='col'>
                                        <div className='form-group'>
                                            <h6>REGULAR PRICE</h6>
                                            <input type='text' name="price" placeholder="e.g., $10.00" />
                                        </div>
                                    </div>
                                    <div className='col'>
                                        <div className='form-group'>
                                            <h6>DISCOUNT PRICE</h6>
                                            <input type='text' name="oldPrice" placeholder="e.g., $8.00" />
                                        </div>
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col'>
                                        <div className='form-group'>
                                            <h6>IS FEATURED</h6>
                                            <Select value={isFeaturedValue} onChange={handleChangeIsFeaturedValue} displayEmpty className='w-100'>
                                                <MenuItem value={false}>False</MenuItem>
                                                <MenuItem value={true}>True</MenuItem>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col'>
                                        <div className='form-group'>
                                            <h6 className='text-uppercase'>Product Images</h6>
                                            <div className='position-relative inputBtn'>
                                                <input type='text' ref={productImages} />
                                                <Button className="btn-blue" onClick={addProductImages}>Add</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col-md-4'>
                                        <div className='form-group'>
                                            <h6>RATINGS</h6>
                                            <Rating name="simple-controlled" value={ratingsValue} onChange={(event, newValue) => setRatingValue(newValue)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button type="button" className="btn-blue btn-lg btn-big w-100">
                                <FaCloudUploadAlt /> &nbsp; PUBLISH AND VIEW
                            </Button>
                        </div>

                        <div className='col-sm-3'>
                            <div className='stickyBox'>
                                <div className="imgGrid d-flex">
                                    {productImagesArr.length !== 0 &&
                                        productImagesArr.map((item, index) => (
                                            <div className='img' key={index}>
                                                <img src={item} alt="Product" />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ProductUpload;
