const video_html = document.getElementById("video_loco")
// const canvas_html = document.getElementById("canvas_html")
const pruebas = () => console.log ( Object.prototype.toString.call(video_html) )
const tipo = (obj) => console.log ( Object.prototype.toString.call(obj) )
// const startVideo = async (video_object) =>
// {
//   // getUserMedia es una método que devuelve una promise de obtener
//   // el DISPOSITIVO de la camera, ocasinalmente returneando un "stream".
//   // Una vez obtenido el stream, le asignamos el stream que viene de la camara
//   // al objeto del html "video" para que lo reproduzca.
//   let stream = await navigator.mediaDevices.getUserMedia
//   ( { video: {} ,audio: false} )

//   video_object.srcObject = stream

//   // return stream
// }

async function startVideo(video_html)
{
  // getUserMedia es una método que devuelve una promise de obtener
  // el DISPOSITIVO de la camera, ocasinalmente returneando un "stream".
  // Una vez obtenido el stream, le asignamos el stream que viene de la camara
  // al objeto del html "video" para que lo reproduzca.
  let stream = await navigator.mediaDevices.getUserMedia
  ({ video: {} ,audio: false})

  video_html.srcObject = stream
}

// CREO QUE FUNCION ASYNC DEBE RETURNEAR UN PROMISE ahí esta
// el temita...

// Llamamos a la función
// startVideo( video_html )

// VAMOS A LA PARTE DE RECONOCER OBJETOS AHORA
// Promise.all()
// Promise es una CLASE, podemos crear objetos tipo promise, ver mi tuto
// de promesas en todo caso. PERO tiene métodos de clase como promise.all que
// básicamente lo que hace es tomar un array de promesas, y UNA VEZ que TODAS
// se HAYAN resuelto, hacemos algo extra.
// Acá epserarmos a CARGAR Los modelos de faceapi, y dps empezamos el video.
// La clase "faceapi" ya viene cargada del "face-api.js" y tiene los modelos necesarios.
// ALTERNATIVAS: Usar un hacer un await faceapi.sarasaa... para cada uno
// O meterlos en una función async y awaitear o lo que queramos

let detection_models =
[
  faceapi.nets.tinyFaceDetector.loadFromUri('/models')
  ,faceapi.nets.faceLandmark68Net.loadFromUri('/models')
  ,faceapi.nets.faceExpressionNet.loadFromUri('/models')
  // ,faceapi.nets.faceRecognitionNet.loadFromUri('/models')
  // ,faceapi.nets.ageGenderNet.loadFromUri('/models')
  // ,faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]

Promise.all(detection_models).then( startVideo( video_html ) )


// Pasemos  a definir los dos bloques que vamos a necesitar que es crear un canvas de faceapi
// y en base a este hacer las detecciones necesarias en el video y pasarlas al canvas.
const create_faceapi_canvas = ( video_html ) =>
{
  // faceapi.detectAllFaces( video_html ).then(console.log(this))
  const displaySize = {width: video_html.width, height: video_html.height}

  // Muy improtante createCanvasFromMedia y no createCanvas, este crea un HTMLVideoelement,
  // el incorrecto crea un HTMLcollection que no sirve para nada dps
  const canvas = faceapi.createCanvasFromMedia(video_html)

  // Matcheamos la dimensiones del canvas de face  
  faceapi.matchDimensions(canvas, displaySize)
  // Le colocamos un Id para reconocerlo mejor dps
  // canvas.setAttribute("id", "canvas_faceapi");
  // document.body.append(canvas)
  // canvas_html.srcObject = canvas
  // canvas_html.setEle
  canvas.setAttribute('id', 'canvas_html');
  // canvas_html.replaceWith(canvas);
  // Nos aseguramos que se appendee justo después del video el elemento
  // así sabemos bien el orden en el html.
  video_html.insertAdjacentElement('afterend', canvas);
  return canvas
}

// Algoritmo de deteccion ydibujado sobre el canvas.
const face_detection_calc_draw = ( video_html, canvas_faceapi, canvas_html ) =>
{
  // Set interval es para repetir las siguientes funciones cada 100ms (determianado por nosotros)
  // La idea es detectar y volver dibujar las detecionnes necesarias.
  setInterval
  (
      async () =>
      {
          const detectionsWithExpressions = await faceapi
          // detectAllFaces lleva un 2do parámetro opcional, que es el MODELO con el cuál queremos reconocer
          // TinyFace es más liviano, si no usa ssdmobilenet más pesado. Se hace medio a lo C con un "new"
          .detectAllFaces(video_html, new faceapi.TinyFaceDetectorOptions() )
          // Agregamos algunos puntitos y trazamos líneas en la cara
          .withFaceLandmarks()
          // Agregamos un score del tipo de expresion de la cara
          .withFaceExpressions()
          console.log(detectionsWithExpressions);
          if (!detectionsWithExpressions) {
            console.log("No face detected in the video stream.")}
          

          // resize the detected boxes and landmarks in case your displayed image has a different size than the original

          // el clearRect siguiente borra el cuadrito anterior, no olvidarselo
          canvas_faceapi.getContext('2d').clearRect(0, 0, canvas_faceapi.width, canvas_faceapi.height)
          const resizedResults = faceapi.resizeResults(detectionsWithExpressions, {width: video_html.width, height: video_html.height})
          console.log(resizedResults);
          faceapi.draw.drawDetections(canvas_faceapi, resizedResults)
          faceapi.draw.drawFaceLandmarks(canvas_faceapi, resizedResults)
          faceapi.draw.drawFaceExpressions(canvas_faceapi, resizedResults)
      }, 100
  )
}

// Finalmente colocamos un "listener" a video_html.
// Esto es con "playing" que implica una vez que esté en play en video PERO además una vez
// que tenga suficiente "data" (no sé cual es el criterio), esto último lo diferencia de "play"
video_html.addEventListener
(
  'playing'
  , async() =>
    {
      let canvas_faceapi = create_faceapi_canvas(video_html)
      face_detection_calc_draw ( video_html, canvas_faceapi, canvas_html )
    }
)
