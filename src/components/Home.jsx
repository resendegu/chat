
import { Box, Button, CssBaseline, Dialog, Divider, Typography} from "@material-ui/core";
import { ChatController, MuiChat,  } from "chat-ui-react";
import React, { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import { useConfirmation } from "../contexts/ConfirmContext";
import { database } from "../firebase";




const Home = () => {
    const [chatCtl] = useState(new ChatController({
      showDateTime: true,

    }));

    const confirm = useConfirmation();

    const userKey = database.ref().push().key;
    let chatKey

    const sendMessage = async (placeholder, save=false, sendButtonText='Enviar') => {
      const text = await chatCtl.setActionRequest({
        type: 'text',
        placeholder: placeholder,
        sendButtonText: sendButtonText,
      });

      text.userKey = userKey;

      if (save) {
        const messageKey = database.ref().push().key;
        text.id = messageKey
        database.ref('chats').child(save).child('messages').transaction((messages) => {
          if (messages) {
            messages.push(text)
          } else {
            messages = [text]
          }
          return messages;
        })
      }

      console.log(text)

      return text;
    }

    const handleOpenChat = async () => {
      chatCtl.clearMessages()

      const chatRef = database.ref('chats').child(chatKey)
      const messagesRef = chatRef.child('messages')

      chatRef.child('status').on('value', async fireStatus => {
        const status = fireStatus.val();
        if (status === 'assigned') {
          chatCtl.cancelActionRequest()
          setStatus('Agente online. Você está sendo atendido')
          await chatCtl.setActionRequest({ type: 'text', always: true, placeholder: 'Digite sua mensagem...' }, (res) => {
            chatCtl.removeMessage(chatCtl.getMessages().length - 1)
            messagesRef.transaction((messages) => {
              res.userKey = userKey
              res.id = database.ref().push().key
              if (messages) {
                messages.push(res)
              } else {
                messages = [res]
              }
    
              return messages;
            })
          });

          messagesRef.on('child_added', fireMessage => {
            const message = fireMessage.val()
    
            chatCtl.addMessage({
              type: message.type,
              content: message.value,
              self: message.userKey === userKey,
            });
        
            
          })
        } else if (status === 'done') {
          chatCtl.cancelActionRequest();
          await confirm({
            variant: "danger",
            catchOnCancel: false,
            title: "Seu chat foi concluído",
            description: "Obrigado por usar nosso chat, você já pode fechar esta janela. Volte sempre!",

          });

          setStatus('Chat finalizado pelo agente.')
        } else {
          setStatus('Você está na fila de atendimento. Aguarde...')
          await chatCtl.addMessage({
            type: 'text',
            content: `Aguarde, em breve você será atendido!`,
            self: false,
            avatar: '-',
          });

          const good = await chatCtl.setActionRequest({
            type: 'custom',
            Component: Restart,
    
          });
          await chatCtl.addMessage({
            type: 'text',
            content: `Reiniciando seu atendimento.`,
            self: false,
            avatar: '-',
          });
        }
      })
    
      
    
      

      
      
      let chatInfo = (await chatRef.once('value')).val()
      delete chatInfo.messages

      

      

      

      return () => {
        messagesRef.off('value');
      }
    }

    useMemo(async () => {
      echo(chatCtl);
    }, [chatCtl]);

    async function echo() {
      chatKey = database.ref().push().key;

      let newChat = {
        userKey: userKey,
        name: '',
        subject: '',
        email: '',
        chatKey: chatKey,
      }
    
      let sendButtonText = 'Enviar';
      await chatCtl.addMessage({
        type: 'text',
        content: `Bem-vindo. Para começar, como gostaria de ser chamado?`,
        self: false,
        avatar: '-',
      });
      const name = await sendMessage('Digite seu nome', chatKey);
      newChat.name = name.value;
    
      await chatCtl.addMessage({
        type: 'text',
        content: `Muito bem ${name.value.split(' ')[0]}.`,
        self: false,
        avatar: '-',
      });
    
      // await chatCtl.addMessage({
      //   type: 'text',
      //   content: `Com quem você deseja falar?`,
      //   self: false,
      //   avatar: '-',
      // });
      // const sel = await chatCtl.setActionRequest({
      //   type: 'select',
      //   options: [
      //     {
      //       value: 'psicologo',
      //       text: 'Psicólogo(a)',
      //     },
      //     {
      //       value: 'medico',
      //       text: 'Médico(a)',
      //     },
      //     {
      //       value: 'outros',
      //       text: 'Outros',
      //     },
      //   ],
      //   sendButtonText: sendButtonText
      // });
      // await chatCtl.addMessage({
      //   type: 'text',
      //   content: `Ok.`,
      //   self: false,
      //   avatar: '-',
      //   sendButtonText: sendButtonText
      // });
    
      await chatCtl.addMessage({
        type: 'text',
        content: `Qual o assunto você quer tratar?`,
        self: false,
        avatar: '-',
        sendButtonText: sendButtonText
      });
      const textSubject = await sendMessage('Digite o assunto...', chatKey);
      newChat.subject = textSubject.value;
    
      await chatCtl.addMessage({
        type: 'text',
        content: `Podemos enviar comunicados para você via e-mail?`,
        self: false,
        avatar: '-',
      });
      const emailQuestion = await chatCtl.setActionRequest({
        type: 'select',
        options: [
          {
            value: 'true',
            text: 'Sim!',
          },
          {
            value: '',
            text: 'Não, obrigado',
          },
        ],
        sendButtonText: sendButtonText
      });
    
      if (emailQuestion.option.value === 'true') {
        await chatCtl.addMessage({
          type: 'text',
          content: `Qual é o seu e-mail?`,
          self: false,
          avatar: '-',
          sendButtonText: sendButtonText
        });
        const emailUser = await sendMessage('Digite seu email...', chatKey);
    
        newChat.email = emailUser.value
      }

      setStatus('Criando sala de atendimento...')
      await database.ref('chats').child(chatKey).update(newChat)
      setStatus('Sala criada. Aguarde ser atendido...')

      handleOpenChat()
      
      
    }

    function Restart({
      chatController,
      actionRequest,
    
    }) {
      const chatCtl = chatController;
    
      const setResponse = useCallback(() => {
        const res = { type: 'custom', value: 'Quero reiniciar o atendimento.' };
        chatCtl.clearMessages()
        chatCtl.setActionResponse(actionRequest, res);
        echo(chatCtl);
        
      }, [actionRequest, chatCtl]);
      return (
        <div>
          <Button
            type="button"
            onClick={setResponse}
            variant="contained"
            color="primary"
          >
            Reiniciar atendimento
          </Button>
        </div>
      );
    }

    const [status, setStatus] = useState('');
    const [attendant, setAttendant] = useState('Atendimento por Chat')
    const [isTypying, setIsTyping] = useState(false);

    return (
        <Fragment>
            <CssBaseline />
            <Box sx={{ height: '100%', maxHeight: '100%', backgroundColor: 'white' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  maxWidth: '640px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  bgcolor: 'background.default',
                  color: 'black',
                  maxHeight: '100%',
                }}
              >
                <Typography sx={{ p: 1 }}>
                  {attendant}
                </Typography>
                <Typography sx={{ p: 1 }} variant="caption" component={"caption"}>
                  {status}
                </Typography>
                <Divider />
                <Box sx={{ flex: '1 1 0%', minHeight: 0 }}>
                  <MuiChat chatController={chatCtl} />
                </Box>
              </Box>
            </Box>
 
        </Fragment>
        
        
      );
}
  
export default Home;