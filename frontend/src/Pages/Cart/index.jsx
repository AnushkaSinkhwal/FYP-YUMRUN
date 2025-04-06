import { Link } from "react-router-dom";
import Rating from '@mui/material/Rating';
import QuantityBox from "../../components/QuantityBox";
import { IoIosClose } from "react-icons/io";
import Button from '@mui/material/Button';
import { IoCartSharp } from "react-icons/io5";
import { useCart } from "../../context/CartContext";
import { Alert } from "@mui/material";

const Cart = () => {
    const { cartItems, cartStats, removeFromCart, updateQuantity } = useCart();

    return (
        <>
            <section className="section cartPage">
                <div className="container">
                    <h2 className="hd mb-1">Your Cart</h2>
                    {cartItems.length > 0 ? (
                        <p>There are <b className="text-red">{cartStats.totalItems}</b> products in your cart</p>
                    ) : (
                        <Alert severity="info" className="mb-3">Your cart is empty. <Link to="/" className="text-decoration-underline">Shop now</Link></Alert>
                    )}

                    {cartItems.length > 0 && (
                        <div className="row">
                            <div className="col-md-9 pr-5">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th width="35%">Product</th>
                                                <th width="15%">Unit Price</th>
                                                <th width="25%">Quantity</th>
                                                <th width="15%">Subtotal</th>
                                                <th width="10%">Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td width="35%">
                                                        <Link to={`/product/${item.id}`}>
                                                            <div className="d-flex align-items-center cartItemimgWrapper">
                                                                <div className="imgWrapper">
                                                                    <img 
                                                                        src={item.image} 
                                                                        className="w-100"
                                                                        alt={item.name}
                                                                    />
                                                                </div>
                                                                <div className="info px-3">
                                                                    <h6>{item.name}</h6>
                                                                    <Rating name="read-only" value={item.rating} readOnly precision={0.5} size="small"/>
                                                                    {item.cookingMethod && (
                                                                        <div className="text-muted small">
                                                                            <span>Method: {item.cookingMethod}</span>
                                                                            {item.servingSize && <span> • Size: {item.servingSize} person</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td width="15%">Rs.{item.price}</td>
                                                    <td width="25%" >
                                                        <QuantityBox 
                                                            initialValue={item.quantity} 
                                                            onChange={(newQuantity) => updateQuantity(item.id, newQuantity)}
                                                        />
                                                    </td>
                                                    <td width="15%">Rs.{item.price * item.quantity}</td>
                                                    <td width="10%">
                                                        <span 
                                                            className="remove" 
                                                            onClick={() => removeFromCart(item.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <IoIosClose/>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="col-md-3">
                                <div className="card border p-3 cartDetails ">
                                    <h4>CART TOTAL</h4>

                                    <div className="d-flex align-items-center mb-3">
                                        <span>Subtotal</span>
                                        <span className="ml-auto text-red font-weight-bold"> Rs.{cartStats.subTotal}</span>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <span>Shipping</span>
                                        <span className="ml-auto"><b> {cartStats.shipping === 0 ? 'Free' : `Rs.${cartStats.shipping}`} </b>  </span>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <span>Estimate for</span>
                                        <span className="ml-auto"><b>Bhaktapur</b></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <span>Total</span>
                                        <span className="ml-auto text-red font-weight-bold">Rs.{cartStats.total}</span>
                                    </div>
                                    <br/>

                                    <Button component={Link} to="/checkout" className="btn-blue bg-red btn-lg btn-big"><IoCartSharp/> Checkout</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Cart;
