using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Controllers
{
	[ApiController]
	[Route("api/time-entry")]
	public class TimeEntryController : ControllerBase
	{
		private readonly TimeLedgerDbContext _db;
		private readonly UserManager<ApplicationUser> _userManager;

		public TimeEntryController(TimeLedgerDbContext db, UserManager<ApplicationUser> userManager)
		{
			_db = db;
			_userManager = userManager;
		}

		[Authorize]
		[HttpGet("{projectId:int}")]
		public async Task<ActionResult<IEnumerable<TimeEntryResponseDto>>> GetTimeEntriesByProjectIdAsync(int projectId)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var responseDto = await _db.TimeEntries
				.AsNoTracking()
				.Where(te => te.ProjectId == projectId && te.Project.Client.UserId == userId)
				.OrderBy(te => te.Date)
				.Select(te => new TimeEntryResponseDto
				{
					Id = te.Id,
					Date = te.Date,
					Description = te.Description,
					TimeSpent = te.TimeSpent,
					BillingStatus = te.BillingStatus,
				})
				.ToListAsync();

			return Ok(responseDto);
		}

		[Authorize]
		[HttpGet("{projectId:int}/{timeEntryId:int}", Name = nameof(GetTimeEntryByIdAsync))]
		public async Task<ActionResult<TimeEntryResponseDto>> GetTimeEntryByIdAsync(int projectId, int timeEntryId)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var responseDto = await _db.TimeEntries
				.AsNoTracking()
				.Where(te => te.ProjectId == projectId && te.Id == timeEntryId && te.Project.Client.UserId == userId)
				.Select(te => new TimeEntryResponseDto
				{
					Id = te.Id,
					Date = te.Date,
					Description = te.Description,
					TimeSpent = te.TimeSpent,
					BillingStatus = te.BillingStatus,
				})
				.FirstOrDefaultAsync();

			if (responseDto == null)
			{
				return NotFound();
			}

			return Ok(responseDto);
		}

		[Authorize]
		[HttpPost]
		public async Task<ActionResult<TimeEntryResponseDto>> CreateTimeEntryAsync([FromBody] TimeEntryCreateDto timeEntryDto)
		{

			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var projectId = timeEntryDto.ProjectId;
			var projectExists = await _db.Projects
				.AnyAsync(p => p.Id == projectId && p.Client.UserId == userId);

			if (!projectExists)
			{
				return NotFound();
			}

			if (timeEntryDto.Date is not DateOnly date)
			{
				return BadRequest("A date is required.");
			}
			TimeEntry newTimeEntry = new TimeEntry
			{

				Date = date,
				Description = timeEntryDto.Description,
				TimeSpent = timeEntryDto.TimeSpent,
				BillingStatus = timeEntryDto.BillingStatus,
				ProjectId = timeEntryDto.ProjectId
			};

			_db.Add(newTimeEntry);
			await _db.SaveChangesAsync();

			var responseDto = new TimeEntryResponseDto
			{
				Id = newTimeEntry.Id,
				Date = newTimeEntry.Date,
				Description = newTimeEntry.Description,
				TimeSpent = newTimeEntry.TimeSpent,
				BillingStatus = newTimeEntry.BillingStatus
			};

			return CreatedAtRoute(
				nameof(GetTimeEntryByIdAsync),
				new { projectId = timeEntryDto.ProjectId, timeEntryId = responseDto.Id },
				responseDto
			);
		}

		[Authorize]
		[HttpPut("{id:int}")]
		public async Task<ActionResult<TimeEntryResponseDto>> UpdateTimeEntryAsync(int id, [FromBody] TimeEntryUpdateDto timeEntryDto)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var updateTimeEntry = await _db.TimeEntries
				.FirstOrDefaultAsync(te =>
					te.Id == id && te.Project.Client.UserId == userId);

			if (updateTimeEntry == null)
			{
				return NotFound();
			}

			if (timeEntryDto.Date is not DateOnly date)
			{
				return BadRequest("A date is required.");
			}
			updateTimeEntry.Date = date;
			updateTimeEntry.Description = timeEntryDto.Description;
			updateTimeEntry.TimeSpent = timeEntryDto.TimeSpent;
			updateTimeEntry.BillingStatus = timeEntryDto.BillingStatus;

			await _db.SaveChangesAsync();

			TimeEntryResponseDto responseDto = new()
			{
				Id = updateTimeEntry.Id,
				Date = updateTimeEntry.Date,
				Description = updateTimeEntry.Description,
				TimeSpent = updateTimeEntry.TimeSpent,
				BillingStatus = updateTimeEntry.BillingStatus,
			};

			return Ok(responseDto);
		}

		[Authorize]
		[HttpPatch("{id:int}")]
		public async Task<ActionResult<TimeEntryResponseDto>> UpdateBillingStatus(int id, [FromBody] BillingStatus billingStatus)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var updateTimeEntry = await _db.TimeEntries
				.FirstOrDefaultAsync(te =>
					te.Id == id && te.Project.Client.UserId == userId);

			if (updateTimeEntry == null)
			{
				return NotFound();
			}

			updateTimeEntry.BillingStatus = billingStatus;

			await _db.SaveChangesAsync();

			TimeEntryResponseDto responseDto = new()
			{
				Id = updateTimeEntry.Id,
				Date = updateTimeEntry.Date,
				Description = updateTimeEntry.Description,
				TimeSpent = updateTimeEntry.TimeSpent,
				BillingStatus = updateTimeEntry.BillingStatus,
			};

			return Ok(responseDto);
		}

		[Authorize]
		[HttpDelete("{id:int}")]
		public async Task<IActionResult> DeleteTimeEntryAsync(int id)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var timeEntry = await _db.TimeEntries
				.FirstOrDefaultAsync(te =>
					te.Id == id && te.Project.Client.UserId == userId);
			if (timeEntry == null)
			{
				return NotFound();
			}

			_db.TimeEntries.Remove(timeEntry);
			await _db.SaveChangesAsync();

			return NoContent();
		}
	}
}
