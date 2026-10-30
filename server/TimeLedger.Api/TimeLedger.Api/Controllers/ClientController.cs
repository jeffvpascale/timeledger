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
	[Route("api/client")]
	public class ClientController : ControllerBase
	{
		private readonly TimeLedgerDbContext _db;
		private readonly UserManager<ApplicationUser> _userManager;

		public ClientController(TimeLedgerDbContext db, UserManager<ApplicationUser> userManager)
		{
			_db = db;
			_userManager = userManager;
		}

		[Authorize]
		[HttpGet]
		public async Task<ActionResult<IEnumerable<ClientResponseDto>>> GetAllClientsAsync()
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			List<ClientResponseDto> responseDtos = await _db.Clients
				.AsNoTracking()
				.Where(c => c.UserId == userId)
				.Select(client => new ClientResponseDto
				{
					Id = client.Id,
					Name = client.Name,
					IsArchived = client.IsArchived
				})
				.OrderBy(c => c.Name)
				.ToListAsync();

			return Ok(responseDtos);
		}

		[Authorize]
		[HttpGet("{id:int}", Name = nameof(GetClientByIdAsync))]
		public async Task<ActionResult<ClientResponseDto>> GetClientByIdAsync(int id)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var responseDto = await _db.Clients
				.AsNoTracking()
				.Where(c => c.Id == id && c.UserId == userId)
				.Select(c => new ClientResponseDto
				{
					Id = c.Id,
					Name = c.Name,
					IsArchived = c.IsArchived
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
		public async Task<ActionResult<ClientResponseDto>> CreateClientAsync([FromBody] ClientCreateDto clientDto)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var trimmedClientName = clientDto.Name.Trim();
			Client newClient = new Client
			{
				Name = trimmedClientName,
				IsArchived = false,
				UserId = userId
			};

			var duplicateExists = await _db.Clients.Where(c => c.UserId == userId).AnyAsync(c =>
				c.Name.Trim() == trimmedClientName);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique client name."
				});
			}

			_db.Add(newClient);
			await _db.SaveChangesAsync();

			var responseDto = new ClientResponseDto
			{
				Id = newClient.Id,
				Name = newClient.Name,
				IsArchived = newClient.IsArchived
			};

			return CreatedAtRoute(
				nameof(GetClientByIdAsync),
				new { id = responseDto.Id },
				responseDto
			);
		}

		[Authorize]
		[HttpPut("{id:int}")]
		public async Task<ActionResult<ClientResponseDto>> UpdateClientAsync(int id, [FromBody] ClientUpdateDto clientDto)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}
			var trimmedClientName = clientDto.Name.Trim();
			var updateClient = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
			if (updateClient == null)
			{
				return NotFound();
			}
			var duplicateExists = await _db.Clients.AnyAsync(c =>
				c.Id != id &&
				c.UserId == userId &&
				c.Name.Trim() == trimmedClientName);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique client name."
				});
			}

			updateClient.Name = trimmedClientName;
			updateClient.IsArchived = clientDto.IsArchived;

			await _db.SaveChangesAsync();

			ClientResponseDto responseDto = new()
			{
				Id = updateClient.Id,
				Name = updateClient.Name,
				IsArchived = updateClient.IsArchived,
			};

			return Ok(responseDto);
		}
	}
}
