import { useContext, useEffect, useState } from 'react';
import Logo from '../../assets/images/logo.png';
import patern from '../../assets/images/pattern.webp';
import { MyContext } from '../../App';
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import Button from '@mui/material/Button';
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import googleIcon from '../../assets/images/googleIcon.png';
import { IoMdHome } from "react-icons/io";

const SignUp = () => {

    const [inputIndex, setInputIndex] = useState(null);
    const [isShowPassword, setisShowPassword] = useState(false);
    const [isShowConfirmPassword, setisShowConfirmPassword] = useState(false);

    const context = useContext(MyContext);

    useEffect(() => {
        context.setisHideSidebarAndHeader(true);
        window.scrollTo(0, 0);
    }, []);

    const focusInput = (index) => {
        setInputIndex(index);
    }

    return (
        <>
            <img src={patern} className='loginPatern' />
            <section className="loginSection signUpSection">

                <div className='row'>
                <div className='col-md-8 d-flex align-items-center flex-column part1 justify-content-center'>
    <h1>Welcome to YUMRUN! <br /><span className='text-sky'>ADMIN DASHBOARD</span></h1>
    <p>Your journey towards a healthier and personalized food experience begins here. Discover customized meals, track your nutrition, and stay on top of your health goals with ease.</p>

    <div className='w-100 mt-4'>
        <Link to={'/'}>
            <Button className="btn-blue btn-lg btn-big">
                <IoMdHome /> Go To Home
            </Button>
        </Link>
    </div>
</div>


                    <div className='col-md-4 pr-0'>
                        <div className="loginBox">
                            <div className='logo text-center'>
                                <img src={Logo} width="60px" />
                                <h5 className='font-weight-bold'>Register a new account</h5>
                            </div>

                            <div className='wrapper mt-3 card border'>
                                <form>

                                    <div className={`form-group position-relative ${inputIndex === 0 && 'focus'}`}>
                                        <span className='icon'><FaUserCircle /></span>
                                        <input type='text' className='form-control' placeholder='Enter your name' onFocus={() => focusInput(0)} onBlur={() => setInputIndex(null)} autoFocus />
                                    </div>

                                    <div className={`form-group position-relative ${inputIndex === 1 && 'focus'}`}>
                                        <span className='icon'><MdEmail /></span>
                                        <input type='text' className='form-control' placeholder='Enter your email' onFocus={() => focusInput(1)} onBlur={() => setInputIndex(null)} />
                                    </div>

                                    <div className={`form-group position-relative ${inputIndex === 2 && 'focus'}`}>
                                        <span className='icon'><RiLockPasswordFill /></span>
                                        <input type={`${isShowPassword === true ? 'text' : 'password'}`} className='form-control' placeholder='Enter your password' onFocus={() => focusInput(2)} onBlur={() => setInputIndex(null)} />

                                        <span className='toggleShowPassword' onClick={() => setisShowPassword(!isShowPassword)}>
                                            {
                                                isShowPassword === true ? <IoMdEyeOff /> : <IoMdEye />
                                            }
                                        </span>

                                    </div>

                                    <div className={`form-group position-relative ${inputIndex === 3 && 'focus'}`}>
                                        <span className='icon'><IoShieldCheckmarkSharp /></span>
                                        <input type={`${isShowConfirmPassword === true ? 'text' : 'password'}`} className='form-control' placeholder='Confirm your password' onFocus={() => focusInput(3)} onBlur={() => setInputIndex(null)} />

                                        <span className='toggleShowPassword' onClick={() => setisShowConfirmPassword(!isShowConfirmPassword)}>
                                            {
                                                isShowConfirmPassword === true ? <IoMdEyeOff /> : <IoMdEye />
                                            }
                                        </span>

                                    </div>

                                    <FormControlLabel control={<Checkbox />} label="I agree to the Terms & Conditions" />

                                    <div className='form-group'>
                                        <Button className="btn-blue btn-lg w-100 btn-big">Sign Up</Button>
                                    </div>

                                    <div className='form-group text-center mb-0'>
                                        <div className='d-flex align-items-center justify-content-center or mt-3 mb-3'>
                                            <span className='line'></span>
                                            <span className='txt'>or</span>
                                            <span className='line'></span>
                                        </div>

                                        <Button variant="outlined" className='w-100 btn-lg btn-big loginWithGoogle'>
                                            <img src={googleIcon} width="25px" /> &nbsp; Sign In with Google
                                        </Button>

                                    </div>

                                </form>

                                <span className='text-center d-block mt-3'>
                                    Already have an account?
                                    <Link to={'/login'} className='link color ml-2'>Sign In</Link>
                                </span>

                            </div>

                        </div>
                    </div>
                </div>

            </section>
        </>
    );
}

export default SignUp;
