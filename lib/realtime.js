import io from 'socket.io'
import {randomBytes} from 'crypto'


export default (http) => {
  const chatroom = io(http)
    // Successful connection
    .on('connection', (socket) => {
      console.log('A user connected')

      // Subscribe to client events
      socket.on('MESSAGE_CREATE', (message) =>  {
        chatroom.emit('MESSAGE_CREATE', {
          ...message,
          id: randomBytes(8).toString('hex'),
          timestamp: new Date(),
        })
      })

      socket.on('disconnect', () => {
        console.log('User disconnected')
      })
    })
    // Unsuccessful connection
    .on('error', error => {
      console.error('REALTIME_ERROR', error)
    })
  return http
}
