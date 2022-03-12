import React, { useState, useEffect, Fragment, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { auth, database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { makeStyles } from "@material-ui/core/styles";
import { Backdrop, Box, Button, CircularProgress, Collapse, Container, CssBaseline, Divider, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Paper, Typography } from "@material-ui/core";
import { ChatController, MuiChat } from "chat-ui-react";
import { AccessTime, ArrowForward, ArrowRight, Assignment, AssignmentTurnedIn, Chat, ExpandLess, ExpandMore, HeadsetMic, MoveToInbox, StarBorder } from "@material-ui/icons";
import Navbar from "./Navbar";
import { useConfirmation } from "../contexts/ConfirmContext";
import { useSnackbar } from 'notistack';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70vh',
    backgroundColor: theme.palette.background.paper,
    overflow: 'auto',
    
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    minHeight: '70vh'
  },
  content: {
    height: '70vh',
    padding: '10px',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));

const Chats = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chats, setChats] = useState([]);
  const [chat, setChat] = useState()
  const [status, setStatus] = useState('');

  const confirm = useConfirmation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleLogout = async () => {
    await auth.signOut();

    history.push("/");
  };

  const getFile = async (url) => {
    const response = await fetch(url);
    const data = await response.blob();

    return new File([data], "userPhoto.jpg", { type: "image/jpeg" });
  };

  useEffect(() => {
    if (!user) {
      history.push("/");

      return;
    }

    const chatsRef = database.ref(`chats`);

        chatsRef.on('value', fireChats => {
            const databaseChats = fireChats.val();

            const chats = Object.entries(databaseChats).map(([key, value]) => {
                return {
                  id: key, 
                  email: value.email,
                  name: value.name,
                  subject: value.subject,
                  status: value.status ?? undefined,
                }
            })
            console.log(chats)
            setChats(chats)
        })

        return () => {
            chatsRef.off('value');
        }

  }, [user, history]);

  const [chatCtl] = useState(new ChatController({
    showDateTime: true,

  }));

  // useMemo(async () => {
  //   chatCtl.setActionRequest({ type: 'text', always: true }, (res) =>
  //     chatCtl.addMessage({
  //       type: 'text',
  //       content: `You have entered: ${res.value}`,
  //       self: false,
  //     }),
  //   );
  // }, [chatCtl]);

  

  const handleClick = () => {
    setOpen(!open);
  };

  const handleClick1 = () => {
    setOpen1(!open1);
  };

  const handleClick2 = () => {
    setOpen2(!open2);
  };


  const handleOnInput = async (e) => {
    console.log(e)
  }
  
  const handleChangeStatus = async (status) => {
    let obj = {status: status}
    
    if (status === 'done') {
      obj.doneBy = user.uid
      setOpen2(true)
    } else if (status === 'assigned') {
      setOpen1(true)
    } else {
      setOpen(true)
    }
    try {
      await database.ref('chats').child(chat.chatKey).update(obj) 
      enqueueSnackbar('Chat movido com sucesso.', {title: 'Sucesso', variant: 'success', key:"0", action: <Button onClick={() => closeSnackbar('0')} color="inherit">Fechar</Button>})
    } catch (error) {
      enqueueSnackbar(error.message, {title: 'Erro', variant: 'error', key:"0", action: <Button onClick={() => closeSnackbar('0')} color="inherit">Fechar</Button>})
    }
       
  }

  const handleOpenChat = async (chatKey) => {
    chatCtl.clearMessages()
    setLoading(true)
    const chatRef = database.ref('chats').child(chatKey)
    const messagesRef = chatRef.child('messages')
    
    let chatInfo = (await chatRef.once('value')).val()
    delete chatInfo.messages

    setChat(chatInfo)

    setTitle(chatInfo.name)
    setSubject(chatInfo.subject)

    if (!chatInfo.hasOwnProperty('status')) {
      try {
        await confirm({
          variant: "danger",
          catchOnCancel: true,
          title: "Confirmação",
          description: "Abrir o chat fará com que seja movido para a aba 'Em atendimento'. Você confirma?"
        });
        chatRef.update({status: 'assigned', assignedTo: user.uid})
        setOpen1(true)
      } catch (error) {
        console.log(error)
        setLoading(false)
        return;
      }
      
    }


    messagesRef.on('child_added', fireMessage => {
      const message = fireMessage.val()


      
      chatCtl.addMessage({
        type: message.type,
        content: message.value,
        self: message.userKey === user.uid,
        avatar: message.userKey === user.uid && user.photoURL,
      });
  
      setLoading(false)
    })

    await chatCtl.setActionRequest({ type: 'text', always: true, placeholder: 'Digite sua mensagem...', onInput: handleOnInput }, (res) => {
      chatCtl.removeMessage(chatCtl.getMessages().length - 1)
      messagesRef.transaction((messages) => {
        res.userKey = user.uid
        res.id = database.ref().push().key
        if (messages) {
          messages.push(res)
        } else {
          messages = [res]
        }

        return messages;
      })
    });

    


    return () => {
      messagesRef.off('value');
      
    }
  }


  return (
    <Fragment>
      <Backdrop open={loading} className={classes.backdrop}><CircularProgress /></Backdrop>
      <Navbar />
        <div className={classes.content}>
        
        <Grid container direction="row" spacing={1} alignItems="center">
          <Grid item xs>
            <Paper className={classes.paper} elevation={4}>
              <Typography variant="h5" component={"h4"}>Chats</Typography>
              <Divider variant="middle" />
              <List
                component="nav"
                aria-labelledby="nested-list-subheader"
                subheader={
                  <ListSubheader component="div" id="nested-list-subheader">
                    Clique para abrir um chat
                  </ListSubheader>
                }
                className={classes.root}
                
              >
                
                <ListItem button onClick={handleClick}>
                  <ListItemIcon>
                    <AccessTime style={{color: '#ebc334'}} />
                  </ListItemIcon>
                  <ListItemText primary="Pendente" />
                  {open ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                  {chats.map((value, i) => {
                    if (value.status) {
                      return;
                    }

                    return (
                    <ListItem button className={classes.nested}>
                      <ListItemIcon>
                        <Chat />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleOpenChat(value.id)}>
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                      <ListItemText primary={value.subject} secondary={value.name} />
                    </ListItem>
                  )})}

                    
                  </List>
                </Collapse>



                <ListItem button onClick={handleClick1}>
                  <ListItemIcon>
                    <HeadsetMic style={{color: 'blue'}}/>
                  </ListItemIcon>
                  <ListItemText primary="Em atendimento" />
                  {open1 ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={open1} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                  {chats.map((value, i) => {
                    if (value.status !== 'assigned') {
                      return;
                    }

                    return (
                    <ListItem button className={classes.nested}>
                      <ListItemIcon>
                        <Chat />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleOpenChat(value.id)}>
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                      <ListItemText primary={value.subject} secondary={value.name} />
                    </ListItem>
                  )})}
                  </List>
                </Collapse>


                <ListItem button onClick={handleClick2}>
                  <ListItemIcon>
                    <AssignmentTurnedIn style={{color: 'seagreen'}} />
                  </ListItemIcon>
                  <ListItemText primary="Concluído" />
                  {open2 ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={open2} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                  {chats.map((value, i) => {
                    if (value.status !== 'done') {
                      return;
                    }

                    return (
                    <ListItem button className={classes.nested}>
                      <ListItemIcon>
                        <Chat />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleOpenChat(value.id)}>
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                      <ListItemText primary={value.subject} secondary={value.name} />
                    </ListItem>
                  )})}


                    
                  </List>
                </Collapse>



              </List>  
            </Paper>
          </Grid>
          <Grid item xs={6} sm={6}>
            <Paper className={classes.paper} elevation={4}>
              <Typography variant="h5" component={"h4"}>{subject}</Typography>
              <Divider variant="middle" />
        
                  <CssBaseline />
                  <Box sx={{ height: '70vh', maxHeight: '100%' }}>
                    
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '640px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        bgcolor: 'background.default',
                        color: 'black',
                        maxHeight: '100%',
                        height: '70vh',
                      }}
                    >
                      <Typography sx={{ p: 1 }}>
                        {title}
                      </Typography>
                      <Typography sx={{ p: 1 }} variant="caption" component={"caption"}>
                        {status}
                      </Typography>
                      <Divider />
                      <Box sx={{ flex: '1 1 0%', minHeight: 0, maxHeight: '100%', width: '100%' }} >
                        
                        <MuiChat chatController={chatCtl} />
                      </Box>
                    </Box>
                  </Box>
            </Paper>
          </Grid>
          <Grid item xs>
            <Paper className={classes.paper} elevation={4}>
              <Typography variant="h5" component={"h4"}>Opções</Typography>
              <Divider variant="middle" />
              {chat && (
                <Fragment>
                  <Box m={1}>
                    <Button style={{backgroundColor: '#ebc334', color: 'white'}} fullWidth onClick={() => handleChangeStatus(null)}>Mover para Pendente</Button>
                  </Box>
                  <Box m={1}>
                    <Button style={{backgroundColor: 'blue', color: 'white'}} fullWidth onClick={() => handleChangeStatus('assigned')}>Mover para Em atendimento</Button>
                  </Box>
                  <Box m={1}>
                    <Button style={{backgroundColor: 'seagreen', color: 'white'}} fullWidth onClick={() => handleChangeStatus('done')}>Mover para Concluído</Button>
                  </Box>
                </Fragment>
                
              )}
              
              
              
            </Paper>
          </Grid>
        </Grid>
        

      </div>
    </Fragment>
    
  );
};

export default Chats;
