import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { useAuth } from '../contexts/AuthContext';
import { auth } from "../firebase";
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function Navbar() {
  const classes = useStyles();

  const { user } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await auth.signOut();

    history.push("/");
  };

    useEffect(() => {
        if (!user) {
            history.push("/");

            return;
        }
    })


  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Chat
          </Typography>
          {user && <Button color="inherit" onClick={handleLogout}>Sair</Button>}
        </Toolbar>
      </AppBar>
    </div>
  );
}
