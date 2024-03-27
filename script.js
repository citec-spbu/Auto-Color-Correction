
function loadImage(input, canvas, drawingFunction) {
  const file = input.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const image = new Image();
          image.onload = function() {
              // Подгонка canvas под соотношение сторон изображения
              var ratio = image.width / image.height;
              canvas.width = canvas.height * ratio;

              drawingFunction(canvas, image);
          };
          image.src = e.target.result;
      };
      reader.readAsDataURL(file);
  }
}

function drawImage(canvas, image) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

document.getElementById('imageInput').addEventListener('change', function() {
  loadImage(this, document.getElementById('originalCanvas'), drawImage);
});
 
document.getElementById('processButton').addEventListener('click', function() {
  loadImage(document.getElementById('imageInput'), document.getElementById('processedCanvas'), processImage)
});


function processImage(canvas, image) {
  
  // Инициализация WebGL
  const webGLcanvas = canvas;
  const gl = webGLcanvas.getContext("webgl");

  if (gl === null) {
    alert(
      "Невозможно инициализировать WebGL. Ваш браузер или компьютер могут его не поддерживать."
    );
  }

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(1.0, 0.8, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vertShaderSource = `
    attribute vec2 position;
  
    varying vec2 texCoords;
  
    void main() {
      texCoords = (position + 1.0) / 2.0;
      texCoords.y = 1.0 - texCoords.y;
      gl_Position = vec4(position, 0, 1.0);
    }
  `;
  
  // Алгоритм обработки располагается здесь
  const fragShaderSourse = `
    precision mediump float;
  
    varying vec2 texCoords;
    
    uniform sampler2D textureSampler;

    void main() {
      gl_FragColor = texture2D(textureSampler, texCoords);
    }
  `;
  
  // Инициализация шейдеров
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  
  gl.shaderSource(vertShader, vertShaderSource);
  gl.shaderSource(fragShader, fragShaderSourse);
  
  gl.compileShader(vertShader);
  gl.compileShader(fragShader);
  
  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to link the program:" + gl.getProgramInfoLog(program));
  }
  
  gl.useProgram(program);

  // Создание прямоугольник для отображения текстуры
  const positionLocation = gl.getAttribLocation(program, "position");
  const vertexBuffer = gl.createBuffer();
  
  const vertices = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,

    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  // Создание текстуры из изображения
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Отрисовка
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
