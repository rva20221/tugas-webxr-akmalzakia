function divideVector(position, scale) {
  let res = { ...position }
  Object.keys(res).forEach(key => {
    if (res[key] == 0) return
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
  let c = vec1.z - vec2.z
  return Math.sqrt(a * a + b * b + c * c)
}

AFRAME.registerComponent('shootable', {
  schema: {
    bulletScale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    type: { default: '' },
    velocity: { default: 1 },
    acceleration: { default: 1 },
    initialVelocity: { default: 0 },
    watcherType: {default: 'time'},
    watcherValue: {default: 2}
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
        bullet.setAttribute('static-cannonball', `velocity:${this.data.velocity}; direction:${dir.x} ${dir.y} ${dir.z}; watcher:type=${this.data.watcherType} value=${this.data.watcherValue}`)
      } else if (type === 'glbb') {
        bullet.setAttribute('dynamic-cannonball', `acceleration:${this.data.acceleration}; initialVelocity:${this.data.initialVelocity}; direction:${dir.x} ${dir.y} ${dir.z}; watcher:type=${this.data.watcherType} value=${this.data.watcherValue}`)
        bullet.setAttribute('material', 'color: white')
      }
      el.sceneEl.appendChild(bullet)
    })
  },
  update: function (oldData) {
    const data = this.data
    const el = this.el

    if (Object.keys(oldData).length === 0) return

    data.velocity = data.velocity ?? oldData.velocity
    data.acceleration = data.acceleration ?? oldData.acceleration
    data.initialVelocity = data.initialVelocity ?? oldData.initialVelocity
    data.watcherType = data.watcherType ?? oldData.watcherType
    data.watcherValue = data.watcherValue ?? oldData.watcherValue
  }
});





AFRAME.registerComponent('static-cannonball', {
  schema: {
    velocity: { default: 0 },
    direction: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    watcher: {
      default: {},
      parse: function(value) {
        const res = value.split(' ').reduce((obj, str, index) => {
          let strParts = str.split('=')
          if(strParts[0] && strParts[1]) {
            obj[strParts[0].replace(/\s+/g,'')] = strParts[1].trim()
          }
          return obj
        }, {})
        return res
      },
      stringify: function (value) {
        let string = ''
        const keys = Object.keys(value)
        keys.forEach((key, index) => {
          string += `${key}=${value[key]}`
          if (index !== keys.length) string += ' '
        })

        return string
      }
    }
  },

  init: function () {
    let el = this.el
    this.initialPosition = { ...el.getAttribute('position') }
    this.secondPassed = 0
    this.velocityLog = document.querySelector('#glb-v-log-value')
    this.distanceLog = document.querySelector('#glb-s-log-value')
    this.timeLog = document.querySelector('#glb-t-log-value')
  },

  tick: function (time, timeDelta) {
    let position = this.el.getAttribute('position')
    const timeDeltaSeconds = timeDelta * 0.001
    position.x += (this.data.direction.x * this.data.velocity * timeDeltaSeconds)
    position.y += (this.data.direction.y * this.data.velocity * timeDeltaSeconds)
    position.z += (this.data.direction.z * this.data.velocity * timeDeltaSeconds)
    this.secondPassed += timeDeltaSeconds
    this.watchTime()
    this.watchDistance()
  },

   watchDistance() {
    const watcher = this.data.watcher
    if (!watcher || watcher.type !== 'distance' || watcher.done) return
    const distance = vectorDistance(this.el.getAttribute('position'), this.initialPosition)
    if (distance > watcher.value) {
      this.updateLog(distance, this.data.velocity, this.secondPassed)
      this.data.watcher.done = true
    }
   },

   watchTime() {
    const watcher = this.data.watcher
    if (!watcher || watcher.type !== 'time' || watcher.done) return

    if (this.secondPassed > watcher.value) {
      this.updateLog(vectorDistance(this.el.getAttribute('position'), this.initialPosition), this.data.velocity, this.secondPassed)
      this.data.watcher.done = true
    }
   },

   updateLog(distance, velocity, time) {
    this.velocityLog.setAttribute('value', velocity)
    this.distanceLog.setAttribute('value', Math.round((distance + Number.EPSILON) * 100) / 100)
    this.timeLog.setAttribute('value', Math.round((time + Number.EPSILON) * 100) / 100)
   }
});


AFRAME.registerComponent('dynamic-cannonball', {
  schema: {
    acceleration: { default: 0 },
    initialVelocity: { default: 0 },
    direction: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    watcher: {
      default: {},
      parse: function(value) {
        const res = value.split(' ').reduce((obj, str, index) => {
          let strParts = str.split('=')
          if(strParts[0] && strParts[1]) {
            obj[strParts[0].replace(/\s+/g,'')] = strParts[1].trim()
          }
          return obj
        }, {})
        return res
      },
      stringify: function (value) {
        let string = ''
        const keys = Object.keys(value)
        keys.forEach((key, index) => {
          string += `${key}=${value[key]}`
          if (index !== keys.length) string += ' '
        })

        return string
      }
    }
  },

  init: function () {
    let el = this.el
    this.initialPosition = { ...el.getAttribute('position') }
    this.secondPassed = 0
    this.velocity = this.data.initialVelocity

    this.velocityLog = document.querySelector('#glbb-v-log-value')
    this.distanceLog = document.querySelector('#glbb-s-log-value')
    this.timeLog = document.querySelector('#glbb-t-log-value')
    this.accelerationLog = document.querySelector('#glbb-a-log-value')

    let arrow = document.createElement('a-entity')
    let direction = this.data.direction;
    arrow.setAttribute('arrow', `length: 5; direction: ${direction.x} ${direction.y} ${direction.z}; color: red`)
    this.el.appendChild(arrow)
  },

  tick: function (time, timeDelta) {
    let position = this.el.getAttribute('position')
    const timeDeltaSeconds = timeDelta * 0.001
    this.velocity += this.data.acceleration * timeDeltaSeconds
    position.x += (this.data.direction.x * this.velocity * timeDeltaSeconds)
    position.y += (this.data.direction.y * this.velocity * timeDeltaSeconds)
    position.z += (this.data.direction.z * this.velocity * timeDeltaSeconds)
    this.secondPassed += timeDeltaSeconds

    this.watchDistance()
    this.watchTime()
  },

  watchDistance() {
    const watcher = this.data.watcher
    if (!watcher || watcher.type !== 'distance' || watcher.done) return
    const distance = vectorDistance(this.el.getAttribute('position'), this.initialPosition)
    if (distance > watcher.value) {
      this.updateLog(distance, this.velocity, this.secondPassed, this.data.acceleration)
      this.data.watcher.done = true
    }
  },

  watchTime() {
    const watcher = this.data.watcher
    if (!watcher || watcher.type !== 'time' || watcher.done) return

    if (this.secondPassed > watcher.value) {
      this.updateLog(vectorDistance(this.el.getAttribute('position'), this.initialPosition), this.velocity, this.secondPassed, this.data.acceleration)
      this.data.watcher.done = true
    }
  },

  updateLog(distance, velocity, time, acceleration) {
    this.velocityLog.setAttribute('value', Math.round((velocity + Number.EPSILON) * 100) / 100)
    this.distanceLog.setAttribute('value', Math.round((distance + Number.EPSILON) * 100) / 100)
    this.timeLog.setAttribute('value', Math.round((time + Number.EPSILON) * 100) / 100)
    this.accelerationLog.setAttribute('value', acceleration)
   }
})

AFRAME.registerComponent('white-cannon', {
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      const obj = this.el.getObject3D('mesh')
      obj.traverse(node => {
        if (node.name.indexOf('Object_6') !== -1) {
          node.material.color.set('white')
        }
      })
    })
  }
});


AFRAME.registerComponent('disposable', {
  schema: {
    timeout: { default: 10 }
  },
  init: function () {
    setTimeout(() => {
      this.el.remove()
    }, this.data.timeout * 1000)
  }
});

AFRAME.registerComponent('arrow', {
  schema: {
    direction: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    origin: { type: 'vec3' },
    length: { default: 1 },
    color: { type: 'color' },
    enabled: { default: true }
  },
  init: function () {
    const { direction, origin, length, color, visible } = this.data
    const arrowhelper = new THREE.ArrowHelper(direction, origin, length, color)

    this.el.setObject3D('arrow', arrowhelper)
    this.el.object3D.visible = visible
  },
  update: function (oldData) {
    const data = this.data
    const el = this.el

    if (Object.keys(oldData).length === 0) return

    if (data.direction !== oldData.direction ||
      data.height !== oldData.height ||
      data.depth !== oldData.depth ||
      data.color !== oldData.color) {
      el.setObject3D('arrow', new THREE.ArrowHelper(data.direction, data.origin, data.length, data.color))
    }

    if (data.visible !== oldData.visible) {
      el.object3D.visible = data.visible
    }
  }
})

AFRAME.registerComponent('phase-shift', {
  init: function () {
    var el = this.el
    el.addEventListener('gripdown', function () {
      el.setAttribute('collision-filter', { collisionForces: true })
    })
    el.addEventListener('gripup', function () {
      el.setAttribute('collision-filter', { collisionForces: false })
    })
  }
});



function changeVelocity() {
  const slider = document.querySelector('#velocity-slider')
  const el = document.querySelector('#glb-cannon')
  const display = document.querySelector('#velocity-display')
  if (!el || !slider || !display) return

  const sliderComponent = slider.getAttribute('gui-slider')
  const sliderValue = Math.round(sliderComponent.percent * 10)

  el.setAttribute('shootable', `velocity:${sliderValue}`)

  const displayComponent = display.getAttribute('gui-label')
  displayComponent.value = `Velocity : ${sliderValue}`
  display.setAttribute('gui-label', displayComponent)
}

function changeAcceleration() {
  const slider = document.querySelector('#acceleration-slider')
  const el = document.querySelector('#glbb-cannon')
  const display = document.querySelector('#acceleration-display')
  if (!el || !slider || !display) return

  const sliderComponent = slider.getAttribute('gui-slider')
  const sliderValue = Math.round(sliderComponent.percent * 10)

  el.setAttribute('shootable', `acceleration:${sliderValue}`)

  const displayComponent = display.getAttribute('gui-label')
  displayComponent.value = `Acceleration : ${sliderValue}`
  display.setAttribute('gui-label', displayComponent)
}

function changeInitialVelocity() {
  const slider = document.querySelector('#initial-velocity-slider')
  const el = document.querySelector('#glbb-cannon')
  const display = document.querySelector('#initial-velocity-display')
  if (!el || !slider || !display) return

  const sliderComponent = slider.getAttribute('gui-slider')
  const sliderValue = Math.round(sliderComponent.percent * 10)

  el.setAttribute('shootable', `initialVelocity:${sliderValue}`)

  const displayComponent = display.getAttribute('gui-label')
  displayComponent.value = `Initial Velocity : ${sliderValue}`
  display.setAttribute('gui-label', displayComponent)
}

function changeGLBWatcherType() {
  const toggle = document.querySelector('#glb-watcher-toggle')
  const display = document.querySelector('#glb-watcher-toggle-display')
  const el = document.querySelector('#glb-cannon')

  if (!toggle || !display || !el) return

  const toggleComponent = toggle.getAttribute('gui-toggle')
  const isChecked = toggleComponent.checked
  console.log(isChecked)
  const displayComponent = display.getAttribute('gui-label')
  
  if (isChecked) {
    displayComponent.value = 'Distance'
    el.setAttribute('shootable', 'watcherType:distance')
  }
  else {
    displayComponent.value = 'Time'
    el.setAttribute('shootable', 'watcherType:time')
  }

  display.setAttribute('gui-label', displayComponent)
}

function changeGLBWatcherValue() {
  const slider = document.querySelector('#glb-watcher-value')
  const display = document.querySelector('#glb-watcher-value-display')
  const el = document.querySelector('#glb-cannon')

  if (!slider || !display || !el) return

  const sliderComponent = slider.getAttribute('gui-slider')
  const sliderValue = Math.round(sliderComponent.percent * 10)

  el.setAttribute('shootable', `watcherValue:${sliderValue}`)

  const displayComponent = display.getAttribute('gui-label')
  displayComponent.value = `Value : ${sliderValue}`
  display.setAttribute('gui-label', displayComponent)
  console.log(el.getAttribute('shootable'))
}

function changeGLBBWatcherType() {
  const toggle = document.querySelector('#glbb-watcher-toggle')
  const display = document.querySelector('#glbb-watcher-toggle-display')
  const el = document.querySelector('#glbb-cannon')

  if (!toggle || !display || !el) return

  const toggleComponent = toggle.getAttribute('gui-toggle')
  const isChecked = toggleComponent.checked
  console.log(isChecked)
  const displayComponent = display.getAttribute('gui-label')
  
  if (isChecked) {
    displayComponent.value = 'Distance'
    el.setAttribute('shootable', 'watcherType:distance')
  }
  else {
    displayComponent.value = 'Time'
    el.setAttribute('shootable', 'watcherType:time')
  }

  display.setAttribute('gui-label', displayComponent)
}

function changeGLBBWatcherValue() {
  const slider = document.querySelector('#glbb-watcher-value')
  const display = document.querySelector('#glbb-watcher-value-display')
  const el = document.querySelector('#glbb-cannon')

  if (!slider || !display || !el) return

  const sliderComponent = slider.getAttribute('gui-slider')
  const sliderValue = Math.round(sliderComponent.percent * 10)

  el.setAttribute('shootable', `watcherValue:${sliderValue}`)

  const displayComponent = display.getAttribute('gui-label')
  displayComponent.value = `Value : ${sliderValue}`
  display.setAttribute('gui-label', displayComponent)
  console.log(el.getAttribute('shootable'))
}