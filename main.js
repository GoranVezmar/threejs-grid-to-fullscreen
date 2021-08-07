const lerp = (a, b, t) => {
  return a * (1 - t) + b * t;
}

class ImageGrid {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 10, 1000);
    this.camera.position.z = 600;

    this.camera.fov = (2 * Math.atan(window.innerHeight / 2 / 600) * 180) / Math.PI;
    this.imagesAdded = 0;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);
    this.page = document.querySelector(".js-page");
    this.grid = document.querySelector(".js-grid");
    this.pageBanner = this.page.querySelector(".js-page-banner");
    this.closeButton = this.page.querySelector(".js-close-btn");
    this.fakeGrid = document.querySelector(".js-fake-grid");
    this.fakeGridItems = [...document.querySelectorAll(".js-fake-grid-item")];
    this.materials = [];

    this.time = 0;
    this.hasActiveImage = false;
    this.isMouseDown = false;
    this.wasGridMoving = false;

    this.movementData = {
      previousTransformX: 0,
      previousTransformY: 0,
      currentTransformX: 0,
      currentTransformY: 0,
      cumulativeTransformX: 0,
      cumulativeTransformY: 0,
      startX: 0,
      startY: 0,
      maxMovementX: this.grid.getBoundingClientRect().width / 2,
      maxMovementY: this.grid.getBoundingClientRect().height / 2,
    }

    this.addMeshes();
    this.handleEvents();
    this.resize();
    this.tick();
    this.fadeInImages();
  }

  showPage(img) {
    gsap.set(this.page, {
      display: "block",
    })
    this.pageBanner.style.backgroundImage = `url("${img.src}")`;
  }

  setQuadrant(i) {
    const boundries = i.img.getBoundingClientRect();
    let quadrant = 1;
    if(boundries.top + boundries.height / 2 > window.innerHeight / 2) {
      if(boundries.left + boundries.width / 2 > window.innerWidth / 2) {
        quadrant = 4;
      } else {
        quadrant = 3;
      }
    } else {
      if(boundries.left + boundries.width / 2 > window.innerWidth / 2) {
        quadrant = 1;
      } else {
        quadrant = 2;
      }
    }
    i.mesh.material.uniforms.uActiveQuadrant.value = quadrant;
  }

  fadeOutImages(i) {
    this.imageData.forEach((item) => {
      if(item != i) {
        gsap.to(item.mesh.material.uniforms.uDistance, {
          value: 50,
          duration: 0.6
        })
      }
    });
  }

  fadeInImages() {
    this.imageData.forEach((item) => {
        gsap.to(item.mesh.material.uniforms.uDistance, {
          value: 0,
          duration: 1.5,
          delay: Math.random() / 3
        })
    });
  }

  closePage() {
    if(this.isClosingActive) return;
    this.hasActiveImage = false;
    this.isClosingActive = true;
    gsap.to(this.page, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        this.isClosingActive = false;
        gsap.set(this.page, {
          display: "none",
          opacity: 1
        })
        this.fadeInImages();
      }
    })
  }

  hangleImageClick(i) {
    if (this.hasActiveImage) return;
    this.hasActiveImage = true;
    this.setQuadrant(i);
    this.fadeOutImages(i);
    const timeline = gsap
      .timeline()
      .to(i.mesh.material.uniforms.uCorners.value, {
        x: 1,
        duration: 1.2,
        ease: Power1.easeInOut
      })
      .to(
        i.mesh.material.uniforms.uCorners.value,
        {
          y: 1,
          duration: 1.2,
          ease: Power1.easeInOut
        },
        0.04
      )
      .to(
        i.mesh.material.uniforms.uCorners.value,
        {
          z: 1,
          duration: 1.2,
          ease: Power1.easeInOut
        },
        0.08
      )
      .to(
        i.mesh.material.uniforms.uCorners.value,
        {
          w: 1,
          duration: 1.2,
          ease: Power1.easeInOut
        },
        0.12
      )
      .to(
        i.mesh.material.uniforms.uProgress,
        {
          value: 1,
          duration: 1.8,
          ease: Power1.easeInOut,
          onComplete: () => {
            this.showPage(i.img);
            i.mesh.material.uniforms.uProgress.value = 0;
            i.mesh.material.uniforms.uCorners.value = new THREE.Vector4(0, 0, 0, 0);
            i.mesh.material.uniforms.uDistance.value = 50;
          },
        },
        0
      );
  }

  handleMouseDown(e) {
    this.isMouseDown = true;
    this.fakeGrid.classList.add('grabbed')
    this.movementData.startX = e.clientX;
    this.movementData.startY = e.clientY;
  }

  handleMouseUp(e) {
    if(Math.abs(this.movementData.currentTransformX) > 5 || Math.abs(this.movementData.currentTransformY) > 5) {
      this.wasGridMoving = true;
    } else {
      this.wasGridMoving = false;
    }
    this.fakeGrid.classList.remove('grabbed')
    this.isMouseDown = false;
    this.movementData.previousTransformX += this.movementData.currentTransformX;
    this.movementData.previousTransformY += this.movementData.currentTransformY;
    this.movementData.currentTransformX = 0;
    this.movementData.currentTransformY = 0;
  }


  handleMouseMove(e) {
    if(!this.isMouseDown) return;
    this.movementData.currentTransformX = this.movementData.startX - e.clientX;
    this.movementData.currentTransformY = this.movementData.startY - e.clientY;
  }


  handleEvents() {
    console.log(this.fakeGridItems);
    this.fakeGridItems.forEach((item, index)=> {
      item.addEventListener("click", () => {
        if(!this.wasGridMoving) {
          this.hangleImageClick(this.imageData[index])
        } else {
          this.wasGridMoving = false;
        }
      })
    })

    this.closeButton.addEventListener('click', () => this.closePage())

    window.addEventListener('mousedown', (e)=> this.handleMouseDown(e))
    window.addEventListener('mouseup', (e)=> this.handleMouseUp(e))
    window.addEventListener('mousemove', (e)=> this.handleMouseMove(e))
    
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.camera.fov = (2 * Math.atan(window.innerHeight / 2 / 600) * 180) / Math.PI;

    this.materials.forEach((m) => {
      m.uniforms.uFullscreen.value.x =  window.innerWidth;
      m.uniforms.uFullscreen.value.y = window.innerHeight;
    });

    this.imageData.forEach((i) => {
      const boundries = i.img.getBoundingClientRect();
      i.mesh.scale.set(boundries.width, boundries.height, 1);
      i.top = boundries.top;
      i.left = boundries.left;
      i.width = boundries.width;
      i.height = boundries.height;

      i.mesh.material.uniforms.uImageSize.value.x = boundries.width;
      i.mesh.material.uniforms.uImageSize.value.y = boundries.height;

      i.mesh.material.uniforms.uTextureSize.value.x = 1920;
      i.mesh.material.uniforms.uTextureSize.value.y = 1280;
    });
  }
  
  addMeshes() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 400, 500);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        uTexture: { value: null },
        uTextureSize: { value: new THREE.Vector2(1920, 1280) },
        uProgress: { value: 0.0 },
        uActiveQuadrant: {value: 1},
        uDistance: {value: 50.0},
        uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },
        uFullscreen: { value: new THREE.Vector2( window.innerWidth, window.innerHeight) },
        uImageSize: { value: new THREE.Vector2(1920, 1280) },
      },
      vertexShader: `
        uniform float time;
        uniform float uProgress;
        uniform float uDistance;
        uniform int uActiveQuadrant;
        uniform vec2 uFullscreen;
        uniform vec2 uImageSize;
        uniform vec4 uCorners;
        varying vec2 vSize;
        varying float vOpacity;
        float mixedCorners;

        varying vec2 vUv;
        void main() {
            float PI = 3.1415926;
            vUv = uv;
            float waves = sin(PI*uProgress)*0.2*sin(6.*length(uv) + 7.*uProgress);
            vec3 pos = vec3(position.x, position.y, position.z - uDistance);
            vec4 defaultState = modelMatrix*vec4( pos, 1.0 );
            vec4 fullScreenState = vec4( position, 1.0 );
            fullScreenState.x *=uFullscreen.x;
            fullScreenState.y *=uFullscreen.y;
            if(uActiveQuadrant == 1) {
              mixedCorners = mix(
                mix(uCorners.y,uCorners.x,uv.x),
                mix(uCorners.z,uCorners.w,uv.x),
                uv.y
              );
            };
            if (uActiveQuadrant == 2) {
              mixedCorners = mix(
                mix(uCorners.y,uCorners.x,uv.x),
                mix(uCorners.w,uCorners.z,uv.x),
                uv.y
              );
            };
            if (uActiveQuadrant == 3) {
              mixedCorners = mix(
                mix(uCorners.w,uCorners.z,uv.x),
                mix(uCorners.y,uCorners.x,uv.x),
                uv.y
              );
            };
            if (uActiveQuadrant == 4) {
              mixedCorners = mix(
                mix(uCorners.z,uCorners.w,uv.x),
                mix(uCorners.x,uCorners.y,uv.x),
                uv.y
              );
            };

            vec4 finalState = mix(defaultState,fullScreenState,mixedCorners + waves * 0.35);

            vSize = mix(uImageSize,uFullscreen,mixedCorners);
            vOpacity = uDistance / 50.;

            gl_Position = projectionMatrix * viewMatrix * finalState;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 uTextureSize;
        uniform sampler2D uTexture;
        varying vec2 vUv;
        varying float vOpacity;

        varying vec2 vSize;

        vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize){
            vec2 tempUV = uv - vec2(0.5);

            float quadAspect = quadSize.x/quadSize.y;
            float textureAspect = textureSize.x/textureSize.y;
            if(quadAspect<textureAspect){
                tempUV = tempUV*vec2(quadAspect/textureAspect,1.);
            } else{
                tempUV = tempUV*vec2(1.,textureAspect/quadAspect);
            }

            tempUV += vec2(0.5);
            return tempUV;
        }
        void main() {

            vec2 correctUV = getUV(vUv,uTextureSize,vSize);
            vec4 image = texture2D(uTexture,correctUV);
            image.a = 1. - vOpacity; 
            // gl_FragColor = vec4( vUv,0.,1.);
            gl_FragColor = image;
        }
      `,
      
    opacity: 0.5,
    transparent: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(400, 500, 1);
    this.mesh.position.x = 300;

    this.images = [...document.querySelectorAll(".js-grid-img")];

    this.imageData = this.images.map((img) => {
      const boundries = img.getBoundingClientRect();
      let m = this.material.clone();
      this.materials.push(m);
      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;

      m.uniforms.uTexture.value = texture;

      let mesh = new THREE.Mesh(this.geometry, m);
      this.scene.add(mesh);
      
      return {
        img: img,
        mesh: mesh,
        width: boundries.width,
        height: boundries.height,
        top: boundries.top,
        left: boundries.left,
      };
    });
  }

  tick() {
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    
    this.movementData.cumulativeTransformX = lerp(this.movementData.cumulativeTransformX, this.movementData.previousTransformX + this.movementData.currentTransformX, 0.1);
    this.movementData.cumulativeTransformY = lerp(this.movementData.cumulativeTransformY, this.movementData.previousTransformY + this.movementData.currentTransformY, 0.1);

    this.grid.style.transform = `translate(${-this.movementData.cumulativeTransformX}px, ${-this.movementData.cumulativeTransformY}px)`;

    this.imageData.forEach((i) => {
      i.left = i.img.getBoundingClientRect().left;
      i.top = i.img.getBoundingClientRect().top;
      i.mesh.position.x = i.left - window.innerWidth / 2 + i.width / 2;
      i.mesh.position.y = -i.top + window.innerHeight / 2 - i.height / 2;
    });
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.tick.bind(this));
  }
}

new ImageGrid();
