const MAX_LEVEL = 5;
class ElevatorCtl {
  constructor(elevator) {
    this.elevator = elevator;
    this.floorToStop = [];
    this.elevator.goingUpIndicator(true);
    this.elevator.goingDownIndicator(false);
  }

  addFloorToStop(num) {
    if (!this.floorToStop.includes(num)) {
      this.floorToStop.push(num);
      this.floorToStop.sort((a, b) => a - b);
    }
  }

  removeFloorToStop(num) {
    if (this.floorToStop.includes(num)) {
      const filteredFloors = this.floorToStop.filter(cur => num !== cur);
      this.floorToStop = filteredFloors;
    }
  }

  goToNextUpperFloor() {
    this.elevator.goingUpIndicator(true);
    this.elevator.goingDownIndicator(false);

    const curFloor = this.elevator.currentFloor();
    const targetFloors = this.floorToStop.filter(num => {
      return num > curFloor;
    });

    if (targetFloors.length) {
      const nextFloor = targetFloors.shift();
      this.elevator.goToFloor(nextFloor, true);
      return nextFloor;
    }
    return false;
  }

  goToNextLowerFloor() {
    this.elevator.goingUpIndicator(false);
    this.elevator.goingDownIndicator(true);

    const curFloor = this.elevator.currentFloor();
    const targetFloors = this.floorToStop.filter(num => num < curFloor);

    if (targetFloors.length) {
      const nextFloor = targetFloors.pop();
      this.elevator.goToFloor(nextFloor, true);
      return nextFloor;
    }
    return false;
  }

  hasHigherFloorToStop() {
    const curFloor = this.elevator.currentFloor();
    return !!this.floorToStop.filter(num => {
      return num > curFloor;
    }).length;
  }

  hasLowerFloorToStop() {
    const curFloor = this.elevator.currentFloor();
    return !!this.floorToStop.filter(num => {
      return num < curFloor;
    }).length;
  }

  getCurFloor() {
    return this.elevator.currentFloor();
  }

  goToNextFloor() {
    console.log(
      "next",
      this.elevator.currentFloor(),
      this.elevator.goingUpIndicator(),
      this.elevator.goingDownIndicator(),
    );

    if (this.elevator.currentFloor() === 0) {
      this.elevator.goingUpIndicator(true);
      this.elevator.goingDownIndicator(false);
      return this.goToNextUpperFloor();
    } else if (this.elevator.currentFloor() === MAX_LEVEL) {
      this.elevator.goingUpIndicator(false);
      this.elevator.goingDownIndicator(true);
      return this.goToNextLowerFloor();
    }

    const isGoingUp = this.elevator.goingUpIndicator();

    if (isGoingUp && this.hasHigherFloorToStop()) {
      return this.goToNextUpperFloor();
    } else if (!isGoingUp && this.hasLowerFloorToStop()) {
      return this.goToNextLowerFloor();
    } else if (isGoingUp && this.hasLowerFloorToStop()) {
      return this.goToNextLowerFloor();
    } else if (!isGoingUp && this.hasHigherFloorToStop()) {
      return this.goToNextUpperFloor();
    }
  }
}

module.exports = {
  ElevatorCtl,
};
