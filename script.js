const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl");

if (gl === null) {
  alert(
    "Unable to initialize WebGL. Your browser or machine may not support it."
  );
}

 
function imageProcessing(gl, image) {
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

  // Создаём прямоугольник для отображения
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

// Загрузка изображения
const imageInput = document.getElementById("image-input");
const imageContainer = document.getElementById("image-container");

imageInput.addEventListener("change", function() {
  const file = this.files[0];

  const reader = new FileReader();
  reader.onload = function() {
    const image = new Image();
    image.onload = function() {
      imageProcessing(gl, image);
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
});
