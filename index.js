const elevator = {
  init: function(elevators, floors) {
    const MAX_LEVEL = floors.length - 1;

    class ElevatorCtl {
      constructor(elevator) {
        this.elevator = elevator;
        this.stops = new Set();
        this.setIsGoingUp(true);
        this.dispatcher = null;
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
        console.log(
          "Method: goToNextStop, Current Floor: ",
          this.getCurrentFloor(),
          "Going Up: ",
          this.elevator.goingUpIndicator(),
          "Going Down: ",
          this.elevator.goingDownIndicator(),
        );

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
          const shouldStopWhenGoingDown =
            this.elevator.goingDownIndicator() &&
            direction === "down" &&
            this.dispatcher.downButtonPressed.has(floorNum);

          const shouldStopWhenGoingUp =
            this.elevator.goingUpIndicator() &&
            direction === "up" &&
            this.dispatcher.upButtonPressed.has(floorNum);

          if (shouldStopWhenGoingDown) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.downButtonPressed.delete(floorNum);
          }

          if (shouldStopWhenGoingUp) {
            this.elevator.goToFloor(floorNum, true);
            this.dispatcher.upButtonPressed.delete(floorNum);
          }
        });
      }

      initFloorButtonPressedEvent() {
        this.elevator.on("floor_button_pressed", (floorNum) => {
          this.addStop(floorNum);
        });
      }

      initStoppedAtFloorEvent() {
        this.elevator.on("stopped_at_floor", (floorNum) => {
          this.removeStop(floorNum);
          this.elevator.getPressedFloors().forEach(floorNum => {
            this.addStop(floorNum);
          });
          this.goToNextStop();
        });
      }

      initIdleEvent() {
        this.elevator.on("idle", () => {
          this.elevator.getPressedFloors().forEach(floorNum => {
            this.addStop(floorNum);
          });

          if (this.dispatcher.upButtonPressed.size && this.getIsGoingUp()) {
            const highestFloor = Array.from(this.dispatcher.upButtonPressed)
              .sort((a, b) => a - b)
              .pop();
            this.addStop(highestFloor);
            this.dispatcher.upButtonPressed.delete(highestFloor);
          } else if (this.dispatcher.downButtonPressed.size && !this.getIsGoingUp()) {
            const lowestFloor = Array.from(this.dispatcher.downButtonPressed)
              .sort((a, b) => a - b)
              .shift();
            this.addStop(lowestFloor);
            this.dispatcher.downButtonPressed.delete(lowestFloor);
          } else if (this.dispatcher.upButtonPressed.size) {
            const highestFloor = Array.from(this.dispatcher.upButtonPressed)
              .sort((a, b) => a - b)
              .pop();
            this.addStop(highestFloor);
            this.dispatcher.upButtonPressed.delete(highestFloor);
          } else if (this.dispatcher.downButtonPressed.size) {
            const lowestFloor = Array.from(this.dispatcher.downButtonPressed)
              .sort((a, b) => a - b)
              .shift();
            this.addStop(lowestFloor);
            this.dispatcher.downButtonPressed.delete(lowestFloor);
          }
          this.goToNextStop();
        });
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
            console.log('event received: up button');
            this.upButtonPressed.add(floor.floorNum());
          });
          floor.on("down_button_pressed", () => {
            console.log('event received: down button');
            this.downButtonPressed.add(floor.floorNum());
          });
        });
      }
    }

    const floorDispatcher = new FloorDispatcher(floors);
    const elevatorControllers = elevators.map(elevator => {
      const elev = new ElevatorCtl(elevator);
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
