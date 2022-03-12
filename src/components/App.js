import React from "react";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { AuthProvider } from "../contexts/AuthContext";
import { ConfirmationServiceProvider } from "../contexts/ConfirmContext";

import Chats from "./Chats";
import Home from "./Home";
import Login from "./Login";



function App() {
  return (
    <div style={{ fontFamily: "Avenir" }}>
      <Router>
      <ConfirmationServiceProvider>
        <AuthProvider>
          <Switch>
            <Route path="/chats" component={Chats} />
            <Route path="/login" component={Login} />
            <Route path="/" component={Home} />
          </Switch>
        </AuthProvider>
      </ConfirmationServiceProvider>
        
      </Router>
    </div>
  );
}

export default App;
