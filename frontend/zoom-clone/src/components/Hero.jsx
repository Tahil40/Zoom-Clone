import React from "react";

export default function Hero(){
    return(
        <>
        <div className="HeroContainer">
            <div className="hero-left-section">
                <h1><span>Connect</span> with your <br />Loved Ones</h1>
                <p>Cover a distance by apna video call</p>
                <button>Get Started</button>
            </div>
            <div className="hero-right-section">
                <img src="/public/mobile.png" alt="loading..." />
            </div>
        </div>
        </>
    );
};