const video = document.querySelector('#webcam');
const enableWebcamButton = document.querySelector('#enableWebcamButton');
const disableWebcamButton = document.querySelector('#disableWebcamButton');
const a_Button = document.querySelector('#class-a');
const b_Button = document.querySelector('#class-b');
const c_Button = document.querySelector('#class-c');
const predictBtn = document.querySelector("#predictBtn");
const canvas_A = document.querySelector('#canvasdivA');
const canvas_B = document.querySelector('#canvasdivB');
const canvas_C = document.querySelector('#canvasdivC');
const ResetButton = document.querySelector("#reset"); //Boxfilter

let model = undefined;
var temp_canvas = [] ;
var num = 0 ;

var t ;

mobilenet.load().then((loadedModel)=>{
  model = loadedModel;
  document.querySelector("#status").innerHTML = "model is loaded.";
  enableWebcamButton.disabled = false;
});

function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
  disableWebcamButton.addEventListener('click', disableCam);
  a_Button.addEventListener('click', (e) => addExample(e, 0));
  b_Button.addEventListener('click', (e) => addExample(e, 1));
  c_Button.addEventListener('click', (e) => addExample(e, 2));
  ResetButton.addEventListener('click', Reset);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

function enableCam(event) {
  /* disable this button once clicked.*/
  event.target.disabled = true;
  /* show the disable webcam button once clicked.*/
  disableWebcamButton.disabled = false;
  ResetButton.disabled = false;
  a_Button.disabled = false;
  b_Button.disabled = false;
  c_Button.disabled = false;
  predictBtn.disabled = false;

  /* show the video and canvas elements */


  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };
  
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    //video.addEventListener('loadeddata');

  })
  .catch(function(err){
    console.error('Error accessing media devices.', error);
  });
  

};

predictBtn.addEventListener("click", function(e) {
  predictBtn.disabled = true;
  predictCam() ;
});


function disableCam(event) {
    event.target.disabled = true;
	a_Button.disabled = true;
	b_Button.disabled = true;
	c_Button.disabled = true;
	ResetButton.disabled = true;
	predictBtn.disabled = true;
	enableWebcamButton.disabled = false;
    /* stop streaming */
    video.srcObject.getTracks().forEach(track => {
      track.stop();
    })
  
    /* clean up. some of these statements should be placed in processVid() */
    video.srcObject = null;
	Reset() ;
	
}


let clf = knnClassifier.create();

const classes = ['A', 'B', 'C'];

function predictCam() {
  if (video.srcObject == null) {return;}
	
  if (clf.getNumClasses() > 0) {
    // Get the activation from mobilenet from the webcam.
    const activation = model.infer(video, true);
    // Get the most likely class and confidence from the classifier module.
    clf.predictClass(activation).then((result)=>{
        document.querySelector("#result").innerHTML = 
        `prediction: ${classes[result.label]}, probability: ${result.confidences[result.label]}`;
    });
	
  }
  t = window.setTimeout(predictCam,1000); 
}

let clicks = {0:0, 1:0, 2:0};

function addExample(event, classId) {
  
  clicks[classId] += 1;
  
  switch (classId) {
    case 0:
      event.target.innerHTML = `Add A(${clicks[classId]})`;
      break;
    case 1:
      event.target.innerHTML = `Add B(${clicks[classId]})`;
      break;
    case 2:
      event.target.innerHTML = `Add C(${clicks[classId]})`;
      break;
    default:
  }
  
  const embedding = model.infer(video, true) ;
  
  temp_canvas[num] = document.createElement("canvas");
  temp_canvas[num].width = 160;
  temp_canvas[num].height = 120;
  temp_canvas[num].style.width = '160px';
  temp_canvas[num].style.height = '120px';
  
  switch (classId) {
    case 0:
      canvas_A.appendChild(temp_canvas[num]);
      break;
    case 1:
      canvas_B.appendChild(temp_canvas[num]);
      break;
    case 2:
      canvas_C.appendChild(temp_canvas[num]);
      break;
    default:
  }

  temp_canvas[num].getContext('2d').drawImage(video, 0, 0, 160, 120);
  num = num + 1 ;
  clf.addExample(embedding, classId);
}


function Reset(){
	window.clearTimeout(t);
	predictBtn.disabled = false;
	clicks = {0:0, 1:0, 2:0};
	a_Button.innerHTML = `Add A`;
	b_Button.innerHTML = `Add B`;
	c_Button.innerHTML = `Add C`;

	for( let a = 0 ; a < temp_canvas.length ; a ++ ) {
		temp_canvas[a].getContext('2d').clearRect(0,0,temp_canvas[a].width,temp_canvas[a].height);
	}

	childA_num = canvas_A.childElementCount ;
	for( let b = 0 ; b < childA_num ; b ++ ) {
		canvas_A.removeChild(canvas_A.children[0]);
	}
	
	childB_num = canvas_B.childElementCount ;
	for( let b = 0 ; b < childB_num ; b ++ ) {
		canvas_B.removeChild(canvas_B.children[0]);
	}
	
	childC_num = canvas_C.childElementCount ;
	for( let b = 0 ; b < childC_num ; b ++ ) {
		canvas_C.removeChild(canvas_C.children[0]);
	}
	
	temp_canvas = [] ;
	num = 0 ;
	document.querySelector("#result").innerHTML = ``;
	clf.clearAllClasses() ;
}