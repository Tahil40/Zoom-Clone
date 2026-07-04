import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

const LandingPage = () => {
    return(
        <>
        <div className="LandingPageContainer">
            <Navbar/>
            <Hero/>
        </div>
        </>
    );
};

export default LandingPage;