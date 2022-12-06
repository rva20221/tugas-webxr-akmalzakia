function divideVector(position, scale) {
  let res = { ...position}
  Object.keys(res).forEach(key => {
    if (res[key] == 0 ) return
    res[key] /= scale[key]
  })
  return res
}

function addTwoVector(vec1, vec2, deltaTime = 1) {
  let res = { ...vec1 }
  Object.keys(vec1).forEach(key => {
    res[key] += vec2[key] * deltaTime
  })
  return res
}

function diffTwoVector(vec1, vec2, deltaTime = 1) {
  let res = { ...vec1 }
  Object.keys(vec1).forEach(key => {
    res[key] -= vec2[key] * deltaTime
  })
  return res
}

function vectorDistance(vec1, vec2) {
  let a = vec1.x - vec2.x
  let b = vec1.y - vec2.y
  return Math.sqrt(a*a + b*b)
}

AFRAME.registerComponent('shootable', {
  schema: {
    shootPosition: { type: 'vec3' },
    bulletScale: { type: 'vec3', default: {x: 1, y: 1, z: 1} },
    cannon_type: { 
      default: [],
      parse: function (value) {
        return value.split(' ')
      },
      stringify: function (value) {
        return value.join(' ')
      }
    }
  },
  init: function () {
    let el = this.el
    el.addEventListener('click', ev => {
      if (this.data.cannon_type.length !== 2) return
      
      let cannon_type = this.data.cannon_type[0]
      let bulletSpeed = this.data.cannon_type[1]
      
      let bullet = document.createElement("a-entity")
      let scale = { ...el.getAttribute('scale') }
      let shootPosition = { ...this.data.shootPosition}
      let bulletScale = { ...this.data.bulletScale}
      let objectPosition = divideVector(shootPosition, scale)
      let objectScale = divideVector(bulletScale, scale)
      bullet.setAttribute("position", `${AFRAME.utils.coordinates.stringify(objectPosition)}`)
      bullet.setAttribute("scale", `${AFRAME.utils.coordinates.stringify(objectScale)}`)
      
      if (cannon_type === 'glb') {
        bullet.setAttribute('mixin', 'cannonball')
        bullet.setAttribute('static-cannonball', `velocity:${bulletSpeed};parentScale:${scale.x}`)
      } else if (cannon_type === 'glbb') {
        bullet.setAttribute('mixin', 'cannonball')
        bullet.setAttribute('dynamic-cannonball', `acceleration:${bulletSpeed};parentScale:${scale.x}`)
      }
      console.log(bullet)
      el.appendChild(bullet)
    })
  }
});





AFRAME.registerComponent('static-cannonball', {
  schema: {
    velocity: {default: 0},
    parentScale: {default: 1}
  },

  init: function () {
    let el = this.el
    this.initialPosition = { ...el.getAttribute('position')}
    this.secondPassed = 0
    console.log('init static cannonball with v:' + this.data.velocity)
  },

  tick: function (time, timeDelta) {
    let position = this.el.getAttribute('position')
    position.z += (this.data.velocity * timeDelta * 0.001 / this.data.parentScale)
    this.secondPassed += timeDelta * 0.001
  }
});


AFRAME.registerComponent('dynamic-cannonball', {
  schema: {
    acceleration: {default: 0},
    initialVelocity: {default: 0},
    parentScale: {default: 1}
  },

  init: function () {
    let el = this.el
    this.initialPosition = { ...el.getAttribute('position')}
    this.secondPassed = 0
    this.velocity = this.data.initialVelocity
  },

  update: function () {
    // Do something when component's data is updated.
  },

  remove: function () {
    // Do something the component or its entity is detached.
  },

  tick: function (time, timeDelta) {
    let position = this.el.getAttribute('position')
    this.velocity += this.data.acceleration * timeDelta * 0.001
  }
});


AFRAME.registerComponent('disposable', {
  schema: {
    timeout: {default: 30}
  },
  init: function () {
    setTimeout(() => {
      this.el.remove()
    }, this.data.timeout * 1000)
  }
});