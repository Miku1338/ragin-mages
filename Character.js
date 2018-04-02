import Projectile from '../Projectile';

export default class Character extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, options = {}) {
    super(scene, x, y, key);
    
    //pull specific character config information from characters.json
    this.props={
      type: key,
      motionVector: new Phaser.Math.Vector2(0, 0),
      ...scene.cache.json.get('characters')[key],
      ...options
    };
    
    scene.physics.world.enable(this);
    
    //make the physics body a circle instead of box
    this.body.isCircle = true;
    //set the size based on the constructor parameter set from the scene constructor
    this.body.setCircle(this.props.collider.size);
    //unique offset for each character to make collider fit properly
    this.setOffset(this.props.collider.offset.x, this.props.collider.offset.y);
    this.scene = scene;
    this.isFiring = false;
    this.isDead = false;
    this.setScale(this.props.scale);
    this.setAnimation('stance', this.props.orientation);
    scene.add.existing(this);
  }

  setAnimation(animation, orientation, force = false) {
    if(!force && (this.isDead || this.isFiring)) return;
    orientation = orientation ? orientation : this.props.orientation;
    this.props.orientation = orientation;
    this.anims.play(`${this.props.type}-${animation}-${orientation}`, true);
  }

  motionChanged(vector) {
    return this.props.motionVector.x !== vector.x || this.props.motionVector.y !== vector.y;
  }
  
  /**
   * Moves the character in the specified direction and animates it appropriately
   * @param {Vector2} vector Specifies the direction of motion
   */
  setMotion(vector) {
    if(this.isDead || this.isFiring) return;
    this.props.motionVector = vector;
    this.setVelocity(vector.x * this.props.baseSpeed, vector.y * this.props.baseSpeed);
    let animation = 'stance';
    if(vector.length() != 0) {
      animation = 'walk';
      this.props.orientation = vector.y > 0 ? 'S' : (vector.y < 0 ? 'N' : '');
      this.props.orientation += vector.x > 0  ? 'E' : (vector.x < 0  ? 'W' : '');
    }
    
    this.setAnimation(animation, this.props.orientation);
    
  }

  fire(targetX, targetY) {
    if(this.isDead || this.isFiring) return;
    this.setAnimation('fight', this.props.orientation);
    this.isFiring = true;
    this.setVelocity(0, 0);
    let fireFromX = this.x + this.props.projectile.fireOffset.x * this.props.scale;
    let fireFromY = this.y + this.props.projectile.fireOffset.y * this.props.scale;
    let projectile = new Projectile(this.scene, fireFromX, fireFromY, this.props.projectile.type, targetX, targetY, {range: this.props.projectile.baseRange});
    return projectile;
  }

  die() {
    this.isDead = true;
    this.setAnimation('death', this.props.orientation, true);
    this.setVelocity(0, 0);
  }

  static buildAnimations(scene) {
    if(!this.animationsCreated) {
      const characterTypes = ['fire_monster', 'golem_monster', 'ice_monster', 'knight_hero', 'mage_hero', 'priest_hero', 'spider_monster'];
      const coordinates = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const animations = [
        {
          name: 'stance', frames: 6
        },
        {
          name: 'death', frames: 6
        },
        {
          name: 'fight', frames: 6
        },
        {
          name: 'walk', frames: 6
        },
      ];

      for(const characterType of characterTypes) {
        for(const animation of animations) {
          for(const coordinate of coordinates) {
            let animFrames = scene.anims.generateFrameNames(characterType, {
              start: 1, end: animation.frames, zeroPad: 4,
              prefix: `${animation.name}/${coordinate}/`, suffix: ''
            });
            scene.anims.create({
              key: `${characterType}-${animation.name}-${coordinate}`,
              frames: animFrames,
              frameRate: 10,
              repeat: -1,
              onComplete: Character.animationCompleted,
              onRepeat: Character.animationLoop
            });
          }
        }
      }
      this.animationsCreated = true;
    }
  }

  static animationLoop(character, animation) {
    if(animation.key.includes('fight')) {
      character.isFiring = false;
      character.setAnimation('stance', character.orientation);
    }
    else if(animation.key.includes('death')) {
      character.destroy();
    }
  }

  // sets the character to use an AI, stalking and aiming at the player.
  // doesn't deal with multiple opponents yet.
  setAI(player) {
    this.AIOn = true;
    this.targetPlayer = player;

  }

  // turns off the current AI.
  turnAIOff() {
    this.AIOn = false;
    this.targetPlayer = null;
  }

  // performs one tick worth of time of what the AI is going to do.
  updateAI() {
    if (!this.AIOn) {
      return;
    }
    const targetXPosition = this.targetPlayer.x;
    const targetYPosition = this.targetPlayer.y;
    const xDifference = this.x - targetXPosition;
    const yDifference = this.y - targetYPosition;
    int distance = Math.sqrt(xDifference * xDifference + yDifference * yDifference);
    if (difference > 300) {
      return;
    }
    var xChange = 0;
    var yChange = 0;
    if (xDifference > 0) {
      xChange = -1;
    } else if (xDifference < 0) {
      xChange = 1;
    }
    if (yDifference > 0) {
      yChange = -1;
    } else if (yDifference < 0) {
      yChange = 1;
    }
    setMotion(new Vector(xChange, yChange));

    const shouldFire = Math.random();
    if (shouldFire > 0.15) {
      fire(targetXPosition + 25 * (Math.random() - 0.5), targetYPosition + 25 * (Math.random() - 0.5));
    }
  }
}