const elevator = {
  init: function(elevators, floors) {
    const MAX_LEVEL = floors.length - 1;

    class ElevatorCtl {
      constructor(id, elevator) {
        this.id = id;
        this.elevator = elevator;
        this.setIsGoingUp(true);
        this.dispatcher = null;
      }

      getIsIdle() {
        return this.getPressedFloors().length === 0;
      }

      setDispatcher(dispatcher) {
        this.dispatcher = dispatcher;
      }

      getStatus(methodName = "getStatus") {
        console.log(
          `Status on: ${methodName}`,
          `id: ${this.id}`,
          `currentFloor: ${this.getCurrentFloor()}`,
          `isGoingUp ${this.getIsGoingUp()}`,
          `stops ${this.getPressedFloors()}`,
        );
      }

      getPressedFloors() {
        return this.elevator.getPressedFloors().sort((a, b) => a - b);
      }

      hasPressedFloor() {
        return this.elevator.getPressedFloors().length > 0;
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

      goToFloor(num, isPriority) {
        this.elevator.goToFloor(num, isPriority);
      }

      getHigherStops() {
        const curFloor = this.getCurrentFloor();
        return this.getPressedFloors().filter(num => num > curFloor);
      }

      getLowerStops() {
        const curFloor = this.getCurrentFloor();
        return this.getPressedFloors().filter(num => num < curFloor);
      }

      hasHigherStops() {
        return !!this.getHigherStops().length;
      }

      hasLowerStops() {
        return !!this.getLowerStops().length;
      }

      goUpToFloor(floor, isPriority) {
        this.setIsGoingUp(true);
        this.goToFloor(floor, isPriority);
      }

      goToNextUpperStop() {
        if (this.hasHigherStops()) {
          const nextFloor = this.getHigherStops().shift();
          this.goUpToFloor(nextFloor);
        }
      }

      goDownToFloor(floor, isPriority) {
        this.setIsGoingUp(false);
        this.goToFloor(floor, isPriority);
      }

      goToNextLowerStop() {
        if (this.hasLowerStops()) {
          const nextFloor = this.getLowerStops().pop();
          this.goDownToFloor(nextFloor);
        }
      }

      goToNextStop() {
        this.getStatus("goToNextStop");

        if (this.getCurrentFloor() === 0) {
          this.setIsGoingUp(true);
        } else if (this.getCurrentFloor() === MAX_LEVEL) {
          this.setIsGoingUp(false);
        }

        if (this.getIsGoingUp() && this.hasHigherStops()) {
          console.log("going up with higher stops");
          return this.goToNextUpperStop();
        } else if (!this.getIsGoingUp() && this.hasLowerStops()) {
          console.log("going down with lower stops");
          return this.goToNextLowerStop();
        } else if (this.getIsGoingUp() && this.hasLowerStops()) {
          console.log("going up with lower stops");
          return this.goToNextLowerStop();
        } else if (!this.getIsGoingUp() && this.hasHigherStops()) {
          console.log("going down with lower higher");
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

          const isElevatorFull = this.elevator.loadFactor() === 1;

          const shouldStopWhenGoingDown =
            !this.getIsGoingUp() &&
            this.dispatcher.containsFloorGoingDown(floorNum);

          const shouldStopWhenGoingUp =
            this.getIsGoingUp() &&
            this.dispatcher.containsFloorGoingUp(floorNum);

          if (!isElevatorFull && shouldStopWhenGoingDown) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.removeFloorGoingDown(floorNum);
          }

          if (!isElevatorFull && shouldStopWhenGoingUp) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.removeFloorGoingUp(floorNum);
          }
        });
      }

      initFloorButtonPressedEvent() {
        this.elevator.on("floor_button_pressed", floorNum => {
          console.log("Event: floor_button_pressed", `floorNum: ${floorNum}`);
          this.getStatus("floor_button_pressed");
          // this.goToNextStop();
        });
      }

      initStoppedAtFloorEvent() {
        this.elevator.on("stopped_at_floor", floorNum => {
          console.log("Event: stopped_at_floor", `floorNum: ${floorNum}`);
          if (this.getCurrentFloor() === 0) {
            this.setIsGoingUp(true);
          } else if (this.getCurrentFloor() === MAX_LEVEL) {
            this.setIsGoingUp(false);
          }

          if (this.hasPressedFloor()) {
            this.goToNextStop();
          }
        });
      }

      initIdleEvent() {
        this.elevator.on("idle", () => {
          console.log("Event: idle");
          this.getStatus();
          if (this.hasPressedFloor()) {
            console.log("Evnent: idle, has floor pressed");
            this.goToNextStop();
          } else if (this.dispatcher.haveFloorsToDispatch()) {
            console.log("Evnent: idle, has floor from dispatcher");
            this.goToFloor(this.dispatcher.nextToDispatch());
          } else {
            console.log("Evnent: idle, nothing to do, go idle");
          }
        });
      }
    }

    class FloorDispatcher {
      constructor(floors) {
        this.floors = floors;
        this.upButtonPressed = new Set();
        this.downButtonPressed = new Set();
        this.elevators = [];
        this.nextDispatchGoingUp = true;
        this.initEvents();
      }

      getFirstIdleElevator() {
        for (let i = 0; i < this.elevators.length; i++) {
          const elev = this.elevators[i];
          if (elev.getIsIdle()) {
            return elev;
          }
        }
      }

      initEvents() {
        this.floors.forEach(floor => {
          floor.on("up_button_pressed", () => {
            console.log("event received: up button");
            this.upButtonPressed.add(floor.floorNum());

            const idleElev = this.getFirstIdleElevator();
            idleElev && idleElev.goUpToFloor(this.dispatchLowestGoingUp());
          });
          floor.on("down_button_pressed", () => {
            console.log("event received: down button");
            this.downButtonPressed.add(floor.floorNum());

            const idleElev = this.getFirstIdleElevator();
            idleElev && idleElev.goDownToFloor(this.dispatchHighestGoingDown());
          });
        });
      }

      setElevators(elevators) {
        this.elevators = elevators;
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

      getUpButtonPressed() {
        return Array.from(this.upButtonPressed).sort((a, b) => a - b);
      }

      getDownButtonPressed() {
        return Array.from(this.downButtonPressed).sort((a, b) => a - b);
      }

      dispatchHighestGoingDown() {
        const highest = this.getDownButtonPressed().pop() || 0;
        this.downButtonPressed.delete(highest);
        this.nextDispatchGoingUp = true;
        console.log("Method: dispatchHighestGoingDown", `value: ${highest}`);
        return highest;
      }

      dispatchLowestGoingUp() {
        const lowest = this.getUpButtonPressed().shift() || MAX_LEVEL;
        this.downButtonPressed.delete(lowest);
        this.nextDispatchGoingUp = false;
        console.log("Method: dispatchLowestGoingUp", `value: ${lowest}`);
        return lowest;
      }

      haveFloorsToDispatch() {
        return !!this.upButtonPressed.size || !!this.downButtonPressed.size;
      }

      nextToDispatch() {
        if (this.upButtonPressed.size && this.downButtonPressed.size === 0) {
          return this.dispatchLowestGoingUp();
        } else if (
          this.downButtonPressed.size &&
          this.upButtonPressed.size === 0
        ) {
          return this.dispatchHighestGoingDown();
        }

        if (this.nextDispatchGoingUp) {
          return this.dispatchLowestGoingUp();
        } else {
          return this.dispatchHighestGoingDown();
        }
      }
    }

    const floorDispatcher = new FloorDispatcher(floors);
    const elevatorControllers = elevators.map((elevator, i) => {
      console.log("elevator init with id", i);
      const elev = new ElevatorCtl(i, elevator);
      elev.setDispatcher(floorDispatcher);
      return elev;
    });
    floorDispatcher.setElevators(elevatorControllers);

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
