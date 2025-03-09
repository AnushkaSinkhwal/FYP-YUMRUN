import { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import Logo from '../../images/logo.jpg';
import { TextField, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Google from '../../images/google.jpg';

const SignUp = () => {
    const context = useContext(MyContext);
    const [healthCondition, setHealthCondition] = useState("");

    useEffect(() => {
        console.log("Header and Footer hidden");
        context.setisHeaderFooterShow(false); // Hide header & footer
    }, [context]);

    return (
        <section className="section signInPage">
            <div className="container">
                <div className="box card p-3 shadow border-0">
                    <div className="text-center mb-2"> 
                        <img src={Logo} alt="Logo" className="logo-image"/>
                    </div>
                    
                    <form className="mt-2"> 
                        <h2 className="mb-3 text-center">Sign Up</h2>

                        <div className="row">
                            <div className="col-md-6">
                                <TextField 
                                    id="full-name" 
                                    label="Full Name" 
                                    type="text" 
                                    required 
                                    variant="standard" 
                                    className="w-100" 
                                    sx={{ mb: 1 }} 
                                />
                            </div>

                            <div className="col-md-6">
                                <TextField 
                                    id="contact" 
                                    label="Contact No." 
                                    type="tel" 
                                    required 
                                    variant="standard" 
                                    className="w-100" 
                                    sx={{ mb: 1 }} 
                                />
                            </div>
                        </div>

                        <TextField 
                            id="email" 
                            label="Email Address" 
                            type="email" 
                            required 
                            variant="standard" 
                            className="w-100" 
                            sx={{ mb: 1 }} 
                        />

                        <div className="row">
                            <div className="col-md-6">
                                <TextField 
                                    id="password" 
                                    label="Password" 
                                    type="password" 
                                    required 
                                    variant="standard" 
                                    className="w-100" 
                                    sx={{ mb: 1 }} 
                                />
                            </div>

                            <div className="col-md-6">
                                <TextField 
                                    id="confirm-password" 
                                    label="Confirm Password" 
                                    type="password" 
                                    required 
                                    variant="standard" 
                                    className="w-100" 
                                    sx={{ mb: 1 }} 
                                />
                            </div>
                        </div>

                        <FormControl className="w-100" sx={{ mb: 1 }}>
                            <InputLabel id="health-condition-label">Health Condition</InputLabel>
                            <Select
                                labelId="health-condition-label"
                                id="health-condition"
                                value={healthCondition}
                                onChange={(e) => setHealthCondition(e.target.value)}
                                variant="standard"
                                required
                            >
                                <MenuItem value="Healthy">Healthy</MenuItem>
                                <MenuItem value="Diabetes">Diabetes</MenuItem>
                                <MenuItem value="Heart Condition">Heart Condition</MenuItem>
                                <MenuItem value="Hypertension">Hypertension</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                        </FormControl>

                        <a className="border-effect cursor txt d-block text-center mt-2">Forgot Password?</a>

                        <div className="d-flex align-items-center mt-2 mb-2">
                            <div className="row w-100">
                                <div className="col-md-6">
                                    <Button className="btn-blue col btn-lg btn-big w-100">Sign Up</Button>
                                </div>
                                <div className="col-md-6">
                                    <Link to="/" className="d-block w-100">
                                        <Button className="btn-lg btn-big w-100" variant="outlined" onClick={() => context.setisHeaderFooterShow(true)}>Cancel</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <p className="txt text-center mb-2">
                            Already Registered? <Link to="/signIn" className="border-effect">Sign In</Link>
                        </p>

                        <h6 className="text-center font-weight-bold mb-1">Or Continue with Social Account</h6>

                        <Button className="loginWithGoogle d-block mx-auto" variant="outlined">
                            <img src={Google} alt="Google Sign In"/> Sign In With Google
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default SignUp;
