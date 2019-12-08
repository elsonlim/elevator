const elevator = {
  init: function(elevators, floors) {
    const MAX_LEVEL = floors.length - 1;

    class ElevatorCtl {
      constructor(id, elevator) {
        this.id;
        this.elevator = elevator;
        this.stops = new Set();
        this.setIsGoingUp(true);
        this.dispatcher = null;
      }

      getStatus(methodName = "getStatus") {
        console.log(
          `Status on: ${methodName}`,
          `currentFloor: ${this.getCurrentFloor()}`,
          `isGoingUp ${this.getIsGoingUp()}`,
          `stops ${this.getStops()}`,
          `upButtonPressed ${Array.from(this.dispatcher.upButtonPressed)}`,
          `downButtonPressed ${Array.from(this.dispatcher.downButtonPressed)}`,
        );
      }

      setDispatcher(dispatcher) {
        this.dispatcher = dispatcher;
      }

      setIsGoingUp(isGoingUp) {
        this.elevator.goingUpIndicator(isGoingUp);
        this.elevator.goingDownIndicator(!isGoingUp);
      }

      getIsGoingUp() {
        return !!this.elevator.goingUpIndicator();
      }

      getCurrentFloor() {
        return this.elevator.currentFloor();
      }

      getStops() {
        return Array.from(this.stops).sort((a, b) => a - b);
      }

      addStop(num) {
        this.stops.add(num);
      }

      removeStop(num) {
        this.stops.delete(num);
      }

      goToFloor(num, isPriority) {
        this.elevator.goToFloor(num, isPriority);
      }

      getHigherStops() {
        const curFloor = this.elevator.currentFloor();
        return this.getStops().filter(num => num > curFloor);
      }

      getLowerStops() {
        const curFloor = this.elevator.currentFloor();
        return this.getStops().filter(num => num < curFloor);
      }

      hasHigherStops() {
        return !!this.getHigherStops().length;
      }

      hasLowerStops() {
        return !!this.getLowerStops().length;
      }

      goToNextUpperStop() {
        this.setIsGoingUp(true);
        const targetFloors = this.getHigherStops();

        if (this.hasHigherStops()) {
          const nextFloor = targetFloors.shift();
          this.goToFloor(nextFloor, true);
          this.removeStop(nextFloor);
          return nextFloor;
        }
        return false;
      }

      goToNextLowerStop() {
        this.setIsGoingUp(false);
        const targetFloors = this.getLowerStops();

        if (this.hasLowerStops()) {
          const nextFloor = targetFloors.pop();
          this.goToFloor(nextFloor, true);
          this.removeStop(nextFloor);
          return nextFloor;
        }
        return false;
      }

      goToNextStop() {
        this.getStatus("goToNextStop");

        if (this.getCurrentFloor() === 0) {
          this.setIsGoingUp(true);
          return this.goToNextUpperStop();
        } else if (this.getCurrentFloor() === MAX_LEVEL) {
          this.setIsGoingUp(false);
          return this.goToNextLowerStop();
        }

        if (this.getIsGoingUp() && this.hasHigherStops()) {
          return this.goToNextUpperStop();
        } else if (!this.getIsGoingUp() && this.hasLowerStops()) {
          return this.goToNextLowerStop();
        } else if (this.getIsGoingUp() && this.hasLowerStops()) {
          return this.goToNextLowerStop();
        } else if (!this.getIsGoingUp() && this.hasHigherStops()) {
          return this.goToNextUpperStop();
        } else {
          console.log("Method: goToNextFloor, Status: No stops");
        }
      }

      initPassingFloorEvent() {
        this.elevator.on("passing_floor", (floorNum, direction) => {
          console.log(
            "Event: passing_floor",
            `floorNum: ${floorNum}`,
            `direction: ${direction}`,
          );
          this.getStatus("passing_floor");

          const shouldStopWhenGoingDown =
            !this.getIsGoingUp() &&
            direction === "down" &&
            this.dispatcher.containsFloorGoingDown(floorNum);

          const shouldStopWhenGoingUp =
            this.getIsGoingUp() &&
            direction === "up" &&
            this.dispatcher.containsFloorGoingUp(floorNum);

          if (shouldStopWhenGoingDown) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.removeFloorGoingDown(floorNum);
          }

          if (shouldStopWhenGoingUp) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.removeFloorGoingUp(floorNum);
          }
        });
      }

      initFloorButtonPressedEvent() {
        this.elevator.on("floor_button_pressed", floorNum => {
          console.log("Event: floor_button_pressed", `floorNum: ${floorNum}`);
          this.getStatus("floor_button_pressed");
          this.addStop(floorNum);
        });
      }

      initStoppedAtFloorEvent() {
        this.elevator.on("stopped_at_floor", floorNum => {
          console.log("Event: stopped_at_floor", `floorNum: ${floorNum}`);
          this.getStatus("stopped_at_floor");
          this.removeStop(floorNum);
          this.elevator.getPressedFloors().forEach(floorNum => {
            this.addStop(floorNum);
          });
          this.goToNextStop();
        });
      }

      initIdleEvent() {
        this.elevator.on("idle", () => {
          console.log("Event: idle");
          this.getStatus("idle");

          const shouldPickHigherGoingUp =
            this.dispatcher.containsHigherFloorGoingUp(
              this.getCurrentFloor(),
            ) && this.getIsGoingUp();

          const shouldPickHigherGoingDown =
            this.dispatcher.containsHigherFloorGoingDown(
              this.getCurrentFloor(),
            ) && this.getIsGoingUp();

          const shouldPickLowerGoingDown =
            this.dispatcher.containsLowerFloorGoingDown(
              this.getCurrentFloor(),
            ) && !this.getIsGoingUp();

          const shouldPickLowerGoingUp =
            this.dispatcher.containsLowerFloorGoingUp(this.getCurrentFloor()) &&
            !this.getIsGoingUp();

          if (shouldPickHigherGoingUp) {
            this.addHighestStopGoingUpFromDispatcher();
          } else if (shouldPickLowerGoingDown) {
            this.addLowestStopGoingDownFromDispatcher();
          } else if (shouldPickHigherGoingDown) {
            this.addHighestStopGoingDownFromDispatcher();
          } else if (shouldPickLowerGoingUp) {
            this.addLowestStopGoingUpFromDispatcher();
          } else if (this.dispatcher.upButtonPressed.size) {
            this.addLowestStopGoingUpFromDispatcher();
          } else if (this.dispatcher.downButtonPressed.size) {
            this.addHighestStopGoingDownFromDispatcher();
          } else {
            this.setIsGoingUp(!this.getIsGoingUp());
          }
          this.goToNextStop();
        });
      }

      addHighestStopGoingUpFromDispatcher() {
        console.log("Methods: addHighestStopGoingUpFromDispatcher");
        const highestFloor = this.dispatcher.dispatchHighestGoingUp();
        this.addStop(highestFloor);
      }

      addHighestStopGoingDownFromDispatcher() {
        console.log("Methods: addHighestStopGoingDownFromDispatcher");
        const highestFloor = this.dispatcher.dispatchHighestGoingDown();
        this.addStop(highestFloor);
      }

      addLowestStopGoingUpFromDispatcher() {
        console.log("Methods: addLowestStopGoingUpFromDispatcher");
        const lowestFloor = this.dispatcher.dispatchLowestGoingUp();
        this.addStop(lowestFloor);
      }

      addLowestStopGoingDownFromDispatcher() {
        console.log("Methods: addLowestStopGoingDownFromDispatcher");
        const lowestFloor = this.dispatcher.dispatchLowestGoingDown();
        this.addStop(lowestFloor);
      }
    }

    class FloorDispatcher {
      constructor(floors) {
        this.floors = floors;
        this.upButtonPressed = new Set();
        this.downButtonPressed = new Set();
        this.initEvents();
      }

      initEvents() {
        this.floors.forEach(floor => {
          floor.on("up_button_pressed", () => {
            console.log("event received: up button");
            this.upButtonPressed.add(floor.floorNum());
          });
          floor.on("down_button_pressed", () => {
            console.log("event received: down button");
            this.downButtonPressed.add(floor.floorNum());
          });
        });
      }

      containsFloorGoingDown(floorNum) {
        return this.downButtonPressed.has(floorNum);
      }

      containsFloorGoingUp(floorNum) {
        return this.upButtonPressed.has(floorNum);
      }

      removeFloorGoingUp(floorNum) {
        this.upButtonPressed.delete(floorNum);
      }

      removeFloorGoingDown(floorNum) {
        this.downButtonPressed.delete(floorNum);
      }

      containsHigherFloorGoingUp(floorToCompare) {
        if (this.upButtonPressed.size === 0) {
          return false;
        }
        return !!this.getUpButtonPressed().filter(num => num > floorToCompare)
          .length;
      }

      containsLowerFloorGoingUp(floorToCompare) {
        if (this.upButtonPressed.size === 0) {
          return false;
        }
        return !!this.getUpButtonPressed().filter(num => num < floorToCompare)
          .length;
      }

      containsHigherFloorGoingDown(floorToCompare) {
        if (this.downButtonPressed.size === 0) {
          return false;
        }
        return !!this.getDownButtonPressed().filter(num => num > floorToCompare)
          .length;
      }

      containsLowerFloorGoingDown(floorToCompare) {
        if (this.downButtonPressed.size === 0) {
          return false;
        }
        return !!this.getDownButtonPressed().filter(num => num < floorToCompare)
          .length;
      }

      getUpButtonPressed() {
        return Array.from(this.upButtonPressed).sort((a, b) => a - b);
      }

      getDownButtonPressed() {
        return Array.from(this.downButtonPressed).sort((a, b) => a - b);
      }

      dispatchHighestGoingUp() {
        const highest = this.getUpButtonPressed().pop();
        this.upButtonPressed.delete(highest);
        return highest;
      }

      dispatchLowestGoingUp() {
        const lowest = this.getUpButtonPressed().shift();
        this.upButtonPressed.delete(lowest);
        return lowest;
      }

      dispatchHighestGoingDown() {
        const highest = this.getDownButtonPressed().pop();
        this.downButtonPressed.delete(highest);
        return highest;
      }

      dispatchLowestGoingDown() {
        const lowest = this.getDownButtonPressed().shift();
        this.downButtonPressed.delete(lowest);
        return lowest;
      }
    }

    const floorDispatcher = new FloorDispatcher(floors);
    const elevatorControllers = elevators.map((elevator, i) => {
      const elev = new ElevatorCtl(`ID${i}`, elevator);
      elev.setDispatcher(floorDispatcher);
      return elev;
    });

    elevatorControllers.forEach(elevatorCtrl => {
      elevatorCtrl.initPassingFloorEvent();
      elevatorCtrl.initFloorButtonPressedEvent();
      elevatorCtrl.initStoppedAtFloorEvent();
      elevatorCtrl.initIdleEvent();
    });
  },

  update: function(dt, elevators, floors) {
    // We normally don't need to do anything here
  },
};
