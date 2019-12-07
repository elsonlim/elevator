const elevator = {
  init: function(elevators, floors) {
    const MAX_LEVEL = floors.length - 1;

    class ElevatorCtl {
      constructor(elevator) {
        this.elevator = elevator;
        this.stops = new Set();
        this.setIsGoingUp(true);
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
    const elevatorControllers = elevators.map(
      elevator => new ElevatorCtl(elevator),
    );

    elevatorControllers.forEach(elevatorCtrl => {
      elevatorCtrl.elevator.on("passing_floor", function(floorNum, direction) {
        const shouldStopWhenGoingDown =
          elevatorCtrl.elevator.goingDownIndicator() &&
          direction === "down" &&
          floorDispatcher.downButtonPressed.has(floorNum);

        const shouldStopWhenGoingUp =
          elevatorCtrl.elevator.goingUpIndicator() &&
          direction === "up" &&
          floorDispatcher.upButtonPressed.has(floorNum);

        if (shouldStopWhenGoingDown) {
          elevatorCtrl.elevator.goToFloor(floorNum, true);
          floorDispatcher.downButtonPressed.delete(floorNum);
        }

        if (shouldStopWhenGoingUp) {
          elevatorCtrl.elevator.goToFloor(floorNum, true);
          floorDispatcher.upButtonPressed.delete(floorNum);
        }
      });

      elevatorCtrl.elevator.on("floor_button_pressed", function(floorNum) {
        elevatorCtrl.addStop(floorNum);
        console.log(
          "on elevator floor button press",
          floorNum,
          elevatorCtrl.floorToStop,
        );
      });

      elevatorCtrl.elevator.on("stopped_at_floor", function(floorNum) {
        console.log("stopped");
        elevatorCtrl.removeStop(floorNum);
        elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
          elevatorCtrl.addStop(floorNum);
        });
        elevatorCtrl.goToNextStop();
      });

      elevatorCtrl.elevator.on("idle", function() {
        console.log("idle", elevatorCtrl.floorToStop);
        elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
          elevatorCtrl.addStop(floorNum);
        });
        if (floorDispatcher.upButtonPressed.size && elevatorCtrl.getIsGoingUp()) {
          const highestFloor = Array.from(floorDispatcher.upButtonPressed)
            .sort((a, b) => a - b)
            .pop();
          elevatorCtrl.addStop(highestFloor);
          floorDispatcher.upButtonPressed.delete(highestFloor);
        } else if (floorDispatcher.downButtonPressed.size && !elevatorCtrl.getIsGoingUp()) {
          const lowestFloor = Array.from(floorDispatcher.downButtonPressed)
            .sort((a, b) => a - b)
            .shift();
          elevatorCtrl.addStop(lowestFloor);
          floorDispatcher.downButtonPressed.delete(lowestFloor);
        } else if (floorDispatcher.upButtonPressed.size) {
          const highestFloor = Array.from(floorDispatcher.upButtonPressed)
            .sort((a, b) => a - b)
            .pop();
          elevatorCtrl.addStop(highestFloor);
          floorDispatcher.upButtonPressed.delete(highestFloor);
        } else if (floorDispatcher.downButtonPressed.size) {
          const lowestFloor = Array.from(floorDispatcher.downButtonPressed)
            .sort((a, b) => a - b)
            .shift();
          elevatorCtrl.addStop(lowestFloor);
          floorDispatcher.downButtonPressed.delete(lowestFloor);
        }
        elevatorCtrl.goToNextStop();
      });
    });
  },
  update: function(dt, elevators, floors) {
    // We normally don't need to do anything here
  },
};
