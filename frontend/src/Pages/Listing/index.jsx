import Sidebar from "../../components/Sidebar";
import Button from '@mui/material/Button';
import { IoIosMenu } from "react-icons/io";
import { TfiLayoutGrid4Alt } from "react-icons/tfi";
import { CgMenuGridR } from "react-icons/cg";
import { FaAngleDown } from "react-icons/fa6";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ProductItem from "../../components/ProductItem";
import { useState } from "react";
import { Pagination } from "@mui/material";

const Listing = () => {

    const [anchorEl, setAnchorEl] = useState(null);
    const[productView,setProductView]=useState('four');
    const openDrop = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <section className="product_Listing_Page">
                <div className="container">
                    <div className="productListing d-flex">
                        <Sidebar />

                        <div className="content_right">
                            <img src='https://t4.ftcdn.net/jpg/03/41/36/41/360_F_341364196_0OQg9iqaP3Yrwqh7owRnH3VL5Kpauppl.jpg' className='w-100'
                                style={{ borderRadius: '8px' }} />

                            <div className="showBy mt-3 mb-3 d-flex align-items-center">
                                <div className="d-flex align-items-center btnWrapper">
                                    <Button className={productView==='one' && 'act'} onClick={()=> setProductView('one')}><IoIosMenu /></Button>
                                    <Button className={productView==='three' && 'act'}onClick={()=> setProductView('three')}><CgMenuGridR /></Button>
                                    <Button className={productView==='four' && 'act'}onClick={()=> setProductView('four')}><TfiLayoutGrid4Alt /></Button>
                                    
                                </div>

                                <div className="ml-auto showByFilter">
                                    <Button onClick={handleClick}> Show 9 <FaAngleDown /></Button>
                                    <Menu
                                        className="w-100 showPerPageDropdown"
                                        id="basic-menu"
                                        anchorEl={anchorEl}
                                        open={openDrop}
                                        onClose={handleClose}
                                        MenuListProps={{
                                            'aria-labelledby': 'basic-button',
                                        }}
                                    >
                                        <MenuItem onClick={handleClose}>2</MenuItem>
                                        <MenuItem onClick={handleClose}>4</MenuItem>
                                        <MenuItem onClick={handleClose}>6</MenuItem>
                                        <MenuItem onClick={handleClose}>8</MenuItem>
                                        <MenuItem onClick={handleClose}>10</MenuItem>
                                        <MenuItem onClick={handleClose}>12</MenuItem>
                                    </Menu>
                                </div>
                            </div>

                            <div className="productListing">
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                                <ProductItem itemView={productView}/>
                               
                            </div>

                            <div className="d-flex align-items-center justify-content-center mt-5">
                                <Pagination count={10} color="primary"/>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Listing;
