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

    const elevatorControllers = elevators.map(
      elevator => new ElevatorCtl(elevator),
    );

    const floorUpPressed = new Set();
    const floorDownPressed = new Set();

    floors.forEach(floor => {
      floor.on("up_button_pressed", function() {
        floorUpPressed.add(floor.floorNum());
      });
      floor.on("down_button_pressed", function() {
        floorDownPressed.add(floor.floorNum());
      });
    });

    elevatorControllers.forEach(elevatorCtrl => {
      elevatorCtrl.elevator.on("passing_floor", function(floorNum, direction) {
        const shouldStopWhenGoingDown =
          elevatorCtrl.elevator.goingDownIndicator() &&
          direction === "down" &&
          floorDownPressed.has(floorNum);

        const shouldStopWhenGoingUp =
          elevatorCtrl.elevator.goingUpIndicator() &&
          direction === "up" &&
          floorUpPressed.has(floorNum);

        if (shouldStopWhenGoingDown) {
          elevatorCtrl.elevator.goToFloor(floorNum, true);
          floorDownPressed.delete(floorNum);
        }

        if (shouldStopWhenGoingUp) {
          elevatorCtrl.elevator.goToFloor(floorNum, true);
          floorUpPressed.delete(floorNum);
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
        // Maybe decide where to go next?
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
        if (floorUpPressed.size && elevatorCtrl.getIsGoingUp()) {
          const highestFloor = Array.from(floorUpPressed)
            .sort((a, b) => a - b)
            .pop();
          elevatorCtrl.addStop(highestFloor);
          floorUpPressed.delete(highestFloor);
        } else if (floorDownPressed.size && !elevatorCtrl.getIsGoingUp()) {
          const lowestFloor = Array.from(floorDownPressed)
            .sort((a, b) => a - b)
            .shift();
          elevatorCtrl.addStop(lowestFloor);
          floorDownPressed.delete(lowestFloor);
        } else if (floorUpPressed.size) {
          const highestFloor = Array.from(floorUpPressed)
            .sort((a, b) => a - b)
            .pop();
          elevatorCtrl.addStop(highestFloor);
          floorUpPressed.delete(highestFloor);
        } else if (floorDownPressed.size) {
          const lowestFloor = Array.from(floorDownPressed)
            .sort((a, b) => a - b)
            .shift();
          elevatorCtrl.addStop(lowestFloor);
          floorDownPressed.delete(lowestFloor);
        }
        elevatorCtrl.goToNextStop();
      });
    });
  },
  update: function(dt, elevators, floors) {
    // We normally don't need to do anything here
  },
};
