import React from "react";
import firebase from "firebase/app";

import { auth } from "../firebase";

const Login = () => {
  return (
    <div id="login-page">
      <div id="login-card">
        <h2> Welcome to MyChat! </h2>
        <div
          className="login-button google"
          onClick={() =>
            auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
          }
        >
           Sign In with Google
        </div>
        <br /> <br />
        <div
          className="login-button facebook"
          onClick={() =>
            auth.signInWithRedirect(new firebase.auth.FacebookAuthProvider())
          }
        >
           Sign In with Facebook
        </div>
        <br />
        <br />
        <br />
        <br />
        <br />
        <h4>Design by Alan Binu 💝</h4>
      </div>
    </div>
  );
};

export default Login;
