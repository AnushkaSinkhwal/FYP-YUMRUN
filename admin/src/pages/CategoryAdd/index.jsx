import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { emphasize, styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { FaCloudUploadAlt } from "react-icons/fa";
import { postData } from '../../utils/api';

// Styled Breadcrumb
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor =
        theme.palette.mode === 'light'
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
    const navigate = useNavigate(); // Initialize navigate hook

    const [formFields, setFormFields] = useState({
        name: '',
        images: [],
        color: ''
    });

    const [loading, setLoading] = useState(false);  
    const [errorMessage, setErrorMessage] = useState(''); 

    // Handle input changes
    const changeInput = (e) => {
        setFormFields(prevState => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    // Handle image URL input
    const addImgUrl = (e) => {
        setFormFields(prevState => ({
            ...prevState,
            images: e.target.value.split(',').map(img => img.trim())  
        }));
    };

    // Handle form submission
    const addCategory = async (e) => {
        e.preventDefault();

        if (!formFields.name || !formFields.images.length || !formFields.color) {
            setErrorMessage('Please fill in all fields.');
            return;
        }

        setErrorMessage('');  
        setLoading(true);  

        try {
            await postData('/api/category/create', formFields);
            alert('Category added successfully!');
            navigate('/category'); // Redirect to Category List
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        } finally {
            setLoading(false);  
        }
    };

    return (
        <div className="right-content w-100">
            <div className="card shadow border-0 w-100 flex-row p-4 res-col">
                <h5 className="mb-0">Add Category</h5>
                <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
                    <StyledBreadcrumb
                        component="a"
                        href="#"
                        label="Dashboard"
                        icon={<HomeIcon fontSize="small" />}
                    />
                    <StyledBreadcrumb
                        component="a"
                        label="Category"
                        href="#"
                        deleteIcon={<ExpandMoreIcon />}
                    />
                    <StyledBreadcrumb
                        label="Add Category"
                        deleteIcon={<ExpandMoreIcon />}
                    />
                </Breadcrumbs>
            </div>

            <form className='form' onSubmit={addCategory}>
                {/* Loading Bar */}
                {loading && <LinearProgress />}  

                {/* Error Message Display */}
                {errorMessage && (
                    <div style={{ color: 'red', marginBottom: '10px' }}>
                        {errorMessage}
                    </div>
                )}

                <div className='row'>
                    <div className='col-md-12'>
                        <div className='card p-4 mt-0'>
                            <div className='form-group'>
                                <h6>CATEGORY NAME</h6>
                                <input 
                                    type='text' 
                                    name='name' 
                                    value={formFields.name} 
                                    onChange={changeInput} 
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <h6>IMAGE URL</h6>
                                <input 
                                    type='text' 
                                    name='images' 
                                    value={formFields.images.join(', ')} 
                                    onChange={addImgUrl} 
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <h6>COLOR</h6>
                                <input 
                                    type='text' 
                                    name='color' 
                                    value={formFields.color} 
                                    onChange={changeInput} 
                                    required
                                />
                            </div>

                            <br />

                            <Button 
                                type="submit" 
                                className="btn-blue btn-lg btn-big"
                                disabled={loading} // Disable button when loading
                            >
                                {loading ? "Publishing..." : (
                                    <>
                                        <FaCloudUploadAlt /> &nbsp; PUBLISH AND VIEW
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductUpload;
