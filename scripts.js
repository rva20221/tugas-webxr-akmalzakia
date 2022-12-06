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
    bulletScale: { type: 'vec3', default: {x: 1, y: 1, z: 1} },
    type: { default: ''},
    velocity: { default: 1 },
    acceleration: { default: 1 },
    initialVelocity: { default: 0 }
  },
  init: function () {
    let el = this.el
    console.log(this.data)
    el.addEventListener('click', ev => {

      let type = this.data.type

      if (type != 'glb' && type != 'glbb') return

      let shootPoint = el.object3D.children[0]

      let bulletPosition = new THREE.Vector3()
      let dir = new THREE.Vector3()

      shootPoint.getWorldPosition(bulletPosition)
      shootPoint.getWorldDirection(dir)

      let bullet = document.createElement("a-entity")
      bullet.setAttribute("position", `${AFRAME.utils.coordinates.stringify(bulletPosition)}`)
      bullet.setAttribute('mixin', 'cannonball')
      
      if (type === 'glb') {
        bullet.setAttribute('static-cannonball', `velocity:${this.data.velocity}; direction:${dir.x} ${dir.y} ${dir.z}`)
      } else if (type === 'glbb') {
        bullet.setAttribute('dynamic-cannonball', `acceleration:${this.data.acceleration}; initialVelocity:${this.data.initialVelocity}; direction:${dir.x} ${dir.y} ${dir.z}`)
      }
      console.log(bullet)
      el.sceneEl.appendChild(bullet)
    })
  }
});





AFRAME.registerComponent('static-cannonball', {
  schema: {
    velocity: {default: 0},
    direction: { type: 'vec3', default: {x: 1, y: 1, z: 1} }
  },

  init: function () {
    let el = this.el
    this.initialPosition = { ...el.getAttribute('position')}
    this.secondPassed = 0
    console.log(this.data.direction)
    console.log('init static cannonball with v:' + this.data.velocity)
  },

  tick: function (time, timeDelta) {
    let position = this.el.getAttribute('position')
    const timeDeltaSeconds = timeDelta * 0.001
    // if (this.secondPassed >= 1) console.log(position.z - this.initialPosition.z)
    position.x += (this.data.direction.x * this.data.velocity  * timeDeltaSeconds)
    position.y += (this.data.direction.y * this.data.velocity  * timeDeltaSeconds)
    position.z += (this.data.direction.z * this.data.velocity  * timeDeltaSeconds)
    this.secondPassed += timeDeltaSeconds
  }
});


AFRAME.registerComponent('dynamic-cannonball', {
  schema: {
    acceleration: {default: 0},
    initialVelocity: {default: 0},
    direction: { type: 'vec3', default: {x: 1, y: 1, z: 1} }
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
    const timeDeltaSeconds = timeDelta * 0.001
    this.velocity += this.data.acceleration * timeDeltaSeconds
    position.x += (this.data.direction.x * this.velocity  * timeDeltaSeconds)
    position.y += (this.data.direction.y * this.velocity  * timeDeltaSeconds)
    position.z += (this.data.direction.z * this.velocity  * timeDeltaSeconds)
    this.secondPassed += timeDeltaSeconds
  }
})

AFRAME.registerComponent('white-cannon', {
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      const obj = this.el.getObject3D('mesh')
      obj.traverse(node => {
        console.log(node)
        if(node.name.indexOf('Object_6') !== -1){
          node.material.color.set('white')
        }
      })
    })
  }
});


AFRAME.registerComponent('disposable', {
  schema: {
    timeout: {default: 10}
  },
  init: function () {
    setTimeout(() => {
      this.el.remove()
    }, this.data.timeout * 1000)
  }
});