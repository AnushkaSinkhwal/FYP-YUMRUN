import { HiDotsVertical } from "react-icons/hi";
import { FaUserCircle } from "react-icons/fa";
import { IoMdCart } from "react-icons/io";
import { MdShoppingBag } from "react-icons/md";
import { GiStarsStack } from "react-icons/gi";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useContext, useEffect, useState } from "react";
import { IoIosTimer } from "react-icons/io";
import Button from '@mui/material/Button';
import { Chart } from "react-google-charts";

import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { FaEye } from "react-icons/fa";
import { FaPencilAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import Pagination from '@mui/material/Pagination';
import { MyContext } from "../../App";

import Rating from '@mui/material/Rating';
import { Link } from "react-router-dom";

import { emphasize, styled } from '@mui/material/styles';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardBox from "../Dashboard/components/dashboardBox";

import Checkbox from '@mui/material/Checkbox';

const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

//breadcrumb code
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

const Products = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showBy, setshowBy] = useState('');
    const [showBysetCatBy, setCatBy] = useState('');
    const open = Boolean(anchorEl);

    const ITEM_HEIGHT = 48;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <div className="right-content w-100">
                <div className="card shadow border-0 w-100 flex-row p-4">
                    <h5 className="mb-0">Product List</h5>
                    <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
                        <StyledBreadcrumb
                            component="a"
                            href="#"
                            label="Dashboard"
                            icon={<HomeIcon fontSize="small" />}
                        />
                        <StyledBreadcrumb
                            label="Products"
                            deleteIcon={<ExpandMoreIcon />}
                        />
                    </Breadcrumbs>
                </div>

                <div className="row dashboardBoxWrapperRow dashboardBoxWrapperRowV2">
                    <div className="col-md-12">
                        <div className="dashboardBoxWrapper d-flex">
                            <DashboardBox color={["#1da256", "#48d483"]} icon={<FaUserCircle />} grow={true} />
                            <DashboardBox color={["#c012e2", "#eb64fe"]} icon={<IoMdCart />} />
                            <DashboardBox color={["#2c78e5", "#60aff5"]} icon={<MdShoppingBag />} />
                        </div>
                    </div>
                </div>

                <div className="card shadow border-0 p-3 mt-4">
                    <h3 className="hd">Best Selling Products</h3>

                    <div className="row cardFilters mt-3">
                        <div className="col-md-3">
                            <h4>SHOW BY</h4>
                            <FormControl size="small" className="w-100">
                                <Select
                                    value={showBy}
                                    onChange={(e) => setshowBy(e.target.value)}
                                    displayEmpty
                                    inputProps={{ 'aria-label': 'Without label' }}
                                    labelId="demo-select-small-label"
                                    className="w-100"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value={10}>Category-Based</MenuItem>
                                    <MenuItem value={20}>Health-Focused</MenuItem>
                                    <MenuItem value={30}>Offers</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        <div className="col-md-3">
                            <h4>CATEGORY BY</h4>
                            <FormControl size="small" className="w-100">
                                <Select
                                    value={showBysetCatBy}
                                    onChange={(e) => setCatBy(e.target.value)}
                                    displayEmpty
                                    inputProps={{ 'aria-label': 'Without label' }}
                                    labelId="demo-select-small-label"
                                    className="w-100"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value={10}>Burgers</MenuItem>
                                    <MenuItem value={20}>Pizzas</MenuItem>
                                    <MenuItem value={30}>Beverages</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                    </div>

                    <div className="table-responsive mt-3">
                        <table className="table table-bordered table-striped v-align">
                            <thead className="thead-dark">
                                <tr>
                                    <th>UID</th>
                                    <th style={{ width: '300px' }}>PRODUCT</th>
                                    <th>CATEGORY</th>
                                    <th>RESTAURANT</th>
                                    <th>PRICE</th>
                                    <th>RATING</th>
                                    
                                    <th>REVIEWS</th>
                                    <th>ORDER</th>
                                    <th>SALES</th>
                                    <th>ACTIONS</th>
                                   
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Checkbox {...label} />  <span>#1</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center productBox">
                                            <div className="imgWrapper">
                                                <div className="img card shadow m-0">
                                                    <img src="https://png.pngtree.com/png-clipart/20231017/original/pngtree-burger-food-png-free-download-png-image_13329458.png" className="w-100" />
                                                </div>
                                            </div>
                                            <div className="info pl-3">
                                                <h6>Juicy Beef Burger</h6>
                                                <p>A delicious beef burger with cheese, lettuce, and special sauce.</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Burgers</td>
                                    <td>Burger King</td>
                                    <td>
                                        <div style={{ width: '70px' }}>
                                            <del className="old">$10.00</del>
                                            <span className="new text-danger">$8.00</span>
                                        </div>
                                    </td>
                                    <td><Rating name="read-only" defaultValue={4.5} precision={0.5} size="small" readOnly /></td>
                                    <td>4.9(16)</td>
                                    <td>380</td>
                                    <td>Rs.32802</td>
                                    <td>
                                        <div className="actions d-flex align-items-center">
                                            <Link to="/product/details">
                                                <Button className="secondary" color="secondary"><FaEye /></Button>
                                            </Link>
                                            <Button className="success" color="success"><FaPencilAlt /></Button>
                                            <Button className="error" color="error"><MdDelete /></Button>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Checkbox {...label} />  <span>#2</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center productBox">
                                            <div className="imgWrapper">
                                                <div className="img card shadow m-0">
                                                    <img src="https://img.freepik.com/free-psd/top-view-delicious-pizza_23-2151868964.jpg" className="w-100" />
                                                </div>
                                            </div>
                                            <div className="info pl-3">
                                                <h6>Pepperoni Pizza</h6>
                                                <p>A classic pepperoni pizza with extra cheese and fresh herbs.</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Pizzas</td>
                                    <td>Domino's</td>
                                    <td>
                                        <div style={{ width: '70px' }}>
                                            <del className="old">$15.00</del>
                                            <span className="new text-danger">$12.00</span>
                                        </div>
                                    </td>
                                    <td><Rating name="read-only" defaultValue={4.0} precision={0.5} size="small" readOnly /></td>
                                    <td>4.5(20)</td>
                                    <td>450</td>
                                    <td> Rs.42322</td>
                                    <td>
                                        <div className="actions d-flex align-items-center">
                                            <Link to="/product/details">
                                                <Button className="secondary" color="secondary"><FaEye /></Button>
                                            </Link>
                                            <Button className="success" color="success"><FaPencilAlt /></Button>
                                            <Button className="error" color="error"><MdDelete /></Button>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Checkbox {...label} />  <span>#3</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center productBox">
                                            <div className="imgWrapper">
                                                <div className="img card shadow m-0">
                                                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYqym8pi_ovDeeiUkqlH0kAXNHZ_ehUugS7A&s" className="w-100" />
                                                </div>
                                            </div>
                                            <div className="info pl-3">
                                                <h6>Cold Coffee</h6>
                                                <p>Chilled coffee with whipped cream and chocolate syrup.</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Beverages</td>
                                    <td>Starbucks</td>
                                    <td>
                                        <div style={{ width: '70px' }}>
                                            <del className="old">$5.00</del>
                                            <span className="new text-danger">$4.00</span>
                                        </div>
                                    </td>
                                    <td><Rating name="read-only" defaultValue={4.8} precision={0.5} size="small" readOnly /></td>
                                    <td>4.8(25)</td>
                                    <td>300</td>
                                    <td>Rs.25060</td>
                                    <td>
                                        <div className="actions d-flex align-items-center">
                                            <Link to="/product/details">
                                                <Button className="secondary" color="secondary"><FaEye /></Button>
                                            </Link>
                                            <Button className="success" color="success"><FaPencilAlt /></Button>
                                            <Button className="error" color="error"><MdDelete /></Button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="d-flex tableFooter">
                            <p>showing <b>3</b> of <b>60</b> results</p>
                            <Pagination count={10} color="primary" className="pagination"
                                showFirstButton showLastButton />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Products;