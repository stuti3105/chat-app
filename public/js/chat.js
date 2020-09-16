const socket = io()

//server (emit) -> client(receive)  --acknowledgement-->(server)
//client (emit) -> client(server)  --acknowledgement-->(client)

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Template

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//options

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild

  //height of new message
  const newMessageStyle = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyle.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //visible height
  const visibleHeight = $messages.offsetHeight

  //height of message container
  const containerHeight = $messages.scrollHeight

  //how far have i scrolled
  const scrollOffset = $messages.scrollTop+visibleHeight

  if(containerHeight- newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message', (message) => {
     console.log(message);
     const html = Mustache.render(messageTemplate, {
         username: message.username,
         message: message.text,
         createdAt: moment(message.createdAt).format('h:mm a')
        })
     $messages.insertAdjacentHTML('beforeend', html)
     autoscroll()
})

socket.on('locationMessage', (location) => {
    console.log(location);
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
     });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room, users
  })

  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value 
    socket.emit('sendMessage', message, (error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('delivered')
    })
})

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return console.log("GeoLocation is not supported by your browser");
  }

    $locationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const { latitude, longitude } = coords;

    socket.emit("sendLocation", { latitude, longitude }, () => {
      $locationButton.removeAttribute('disabled')

      console.log("Location sent!");
    });
  });
});

socket.emit('join', {username, room}, (error)=>{
  if(error){
    alert(error)
    location.href= '/'
  }
})