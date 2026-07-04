import React from "react";

export default function Navbar(){
    return(
        <>
        <nav className="navbar">
            <div className="left-section">
                <h1>Apna Video Call</h1>
            </div>
            <div className="right-section">
                <p>Join as Guest</p>
                <p>Register</p>
                <button>Login</button>
            </div>
        </nav>
        </>
    );
};